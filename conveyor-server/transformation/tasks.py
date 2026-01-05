"""
Celery tasks for transformation operations including notebook execution.
"""

from celery import shared_task
from django.utils import timezone
from django.conf import settings
import logging
import json
import sys
import io
import traceback
from contextlib import redirect_stdout, redirect_stderr

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def execute_notebook(self, notebook_id):
    """
    Execute all cells in a notebook asynchronously.
    
    This task runs notebook cells in sequence, capturing outputs
    and handling errors gracefully.
    """
    from .models import Notebook
    
    try:
        notebook = Notebook.objects.get(id=notebook_id)
        notebook.status = 'running'
        notebook.save()
        
        content = notebook.content or {'cells': []}
        cells = content.get('cells', [])
        
        # Create execution context
        execution_globals = {
            '__builtins__': __builtins__,
            '__name__': '__main__',
        }
        
        # Import common data science libraries if available
        try:
            import pandas as pd
            import numpy as np
            execution_globals['pd'] = pd
            execution_globals['np'] = np
        except ImportError:
            pass
        
        # Execute each cell
        for idx, cell in enumerate(cells):
            if cell.get('cell_type') != 'code':
                continue
            
            source = cell.get('source', '')
            if not source.strip():
                continue
            
            cell_output = execute_cell(
                source=source,
                language=notebook.language,
                execution_globals=execution_globals,
                cell_index=idx
            )
            
            # Update cell outputs
            cell['outputs'] = cell_output.get('outputs', [])
            cell['execution_count'] = idx + 1
            
            # If cell failed and it's not set to continue on error, stop
            if cell_output.get('error') and not cell.get('continue_on_error', False):
                notebook.status = 'error'
                notebook.content = content
                notebook.last_executed = timezone.now()
                notebook.save()
                return {
                    'status': 'error',
                    'notebook_id': str(notebook_id),
                    'failed_cell': idx,
                    'error': cell_output.get('error_message')
                }
        
        # All cells executed successfully
        notebook.content = content
        notebook.status = 'idle'
        notebook.last_executed = timezone.now()
        notebook.save()
        
        return {
            'status': 'success',
            'notebook_id': str(notebook_id),
            'cells_executed': len([c for c in cells if c.get('cell_type') == 'code'])
        }
        
    except Notebook.DoesNotExist:
        logger.error(f"Notebook {notebook_id} not found")
        return {'status': 'error', 'error': 'Notebook not found'}
    except Exception as e:
        logger.error(f"Notebook execution failed: {str(e)}")
        try:
            notebook = Notebook.objects.get(id=notebook_id)
            notebook.status = 'error'
            notebook.save()
        except:
            pass
        raise self.retry(exc=e, countdown=60)


def execute_cell(source, language, execution_globals, cell_index):
    """
    Execute a single notebook cell and capture output.
    """
    outputs = []
    error = False
    error_message = None
    
    if language == 'python':
        # Capture stdout and stderr
        stdout_capture = io.StringIO()
        stderr_capture = io.StringIO()
        
        try:
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                # Try to evaluate as expression first (for display output)
                try:
                    result = eval(source, execution_globals)
                    if result is not None:
                        outputs.append({
                            'output_type': 'execute_result',
                            'data': {'text/plain': repr(result)},
                            'execution_count': cell_index + 1
                        })
                except SyntaxError:
                    # Not an expression, execute as statements
                    exec(source, execution_globals)
            
            # Capture stdout
            stdout_value = stdout_capture.getvalue()
            if stdout_value:
                outputs.append({
                    'output_type': 'stream',
                    'name': 'stdout',
                    'text': stdout_value
                })
            
            # Capture stderr
            stderr_value = stderr_capture.getvalue()
            if stderr_value:
                outputs.append({
                    'output_type': 'stream',
                    'name': 'stderr',
                    'text': stderr_value
                })
                
        except Exception as e:
            error = True
            error_message = str(e)
            tb = traceback.format_exc()
            outputs.append({
                'output_type': 'error',
                'ename': type(e).__name__,
                'evalue': str(e),
                'traceback': tb.split('\n')
            })
    
    elif language == 'sql':
        # Execute SQL using Trino
        try:
            import trino
            
            conn = trino.dbapi.connect(
                host=getattr(settings, 'TRINO_HOST', 'trino'),
                port=getattr(settings, 'TRINO_PORT', 8080),
                user=getattr(settings, 'TRINO_USER', 'conveyor'),
                catalog=getattr(settings, 'TRINO_CATALOG', 'iceberg'),
                schema=getattr(settings, 'TRINO_SCHEMA', 'warehouse'),
            )
            cursor = conn.cursor()
            cursor.execute(source)
            
            # Get column names
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            
            cursor.close()
            conn.close()
            
            # Format as table output
            if columns and rows:
                # Create HTML table for rich display
                html_table = '<table><thead><tr>'
                html_table += ''.join(f'<th>{col}</th>' for col in columns)
                html_table += '</tr></thead><tbody>'
                for row in rows[:100]:  # Limit to 100 rows
                    html_table += '<tr>'
                    html_table += ''.join(f'<td>{val}</td>' for val in row)
                    html_table += '</tr>'
                html_table += '</tbody></table>'
                
                outputs.append({
                    'output_type': 'execute_result',
                    'data': {
                        'text/html': html_table,
                        'text/plain': f'{len(rows)} rows × {len(columns)} columns'
                    },
                    'execution_count': cell_index + 1
                })
            else:
                outputs.append({
                    'output_type': 'stream',
                    'name': 'stdout',
                    'text': 'Query executed successfully (no results)'
                })
                
        except Exception as e:
            error = True
            error_message = str(e)
            outputs.append({
                'output_type': 'error',
                'ename': 'SQLError',
                'evalue': str(e),
                'traceback': [str(e)]
            })
    
    elif language == 'r':
        # R execution would require rpy2 or similar
        outputs.append({
            'output_type': 'stream',
            'name': 'stderr',
            'text': 'R execution not yet implemented. Install rpy2 for R support.'
        })
    
    return {
        'outputs': outputs,
        'error': error,
        'error_message': error_message
    }


@shared_task(bind=True)
def execute_notebook_cell(self, notebook_id, cell_index):
    """
    Execute a single cell in a notebook.
    """
    from .models import Notebook
    
    try:
        notebook = Notebook.objects.get(id=notebook_id)
        content = notebook.content or {'cells': []}
        cells = content.get('cells', [])
        
        if cell_index < 0 or cell_index >= len(cells):
            return {'status': 'error', 'error': 'Invalid cell index'}
        
        cell = cells[cell_index]
        if cell.get('cell_type') != 'code':
            return {'status': 'skipped', 'reason': 'Not a code cell'}
        
        source = cell.get('source', '')
        
        # Execute the cell
        execution_globals = {'__builtins__': __builtins__, '__name__': '__main__'}
        
        try:
            import pandas as pd
            import numpy as np
            execution_globals['pd'] = pd
            execution_globals['np'] = np
        except ImportError:
            pass
        
        cell_output = execute_cell(
            source=source,
            language=notebook.language,
            execution_globals=execution_globals,
            cell_index=cell_index
        )
        
        # Update cell outputs
        cell['outputs'] = cell_output.get('outputs', [])
        cell['execution_count'] = cell_index + 1
        
        notebook.content = content
        notebook.last_executed = timezone.now()
        notebook.save()
        
        return {
            'status': 'success' if not cell_output.get('error') else 'error',
            'notebook_id': str(notebook_id),
            'cell_index': cell_index,
            'outputs': cell_output.get('outputs', [])
        }
        
    except Notebook.DoesNotExist:
        return {'status': 'error', 'error': 'Notebook not found'}
    except Exception as e:
        logger.error(f"Cell execution failed: {str(e)}")
        return {'status': 'error', 'error': str(e)}


@shared_task
def run_workflow(workflow_id):
    """
    Execute a transformation workflow.
    """
    from .models import Workflow
    
    try:
        workflow = Workflow.objects.get(id=workflow_id)
        workflow.status = 'running'
        workflow.save()
        
        # Get workflow steps from definition
        definition = workflow.definition or {}
        nodes = definition.get('nodes', [])
        edges = definition.get('edges', [])
        
        # Build execution order (topological sort)
        execution_order = topological_sort(nodes, edges)
        
        results = []
        for node_id in execution_order:
            node = next((n for n in nodes if n.get('id') == node_id), None)
            if not node:
                continue
            
            node_type = node.get('type')
            node_data = node.get('data', {})
            
            # Execute node based on type
            if node_type == 'transformation':
                result = execute_transformation_node(node_data)
            elif node_type == 'quality_check':
                result = execute_quality_check_node(node_data)
            elif node_type == 'notification':
                result = execute_notification_node(node_data)
            else:
                result = {'status': 'skipped', 'reason': f'Unknown node type: {node_type}'}
            
            results.append({
                'node_id': node_id,
                'result': result
            })
            
            # Stop on error
            if result.get('status') == 'error':
                workflow.status = 'failed'
                workflow.save()
                return {
                    'status': 'failed',
                    'workflow_id': str(workflow_id),
                    'failed_at': node_id,
                    'results': results
                }
        
        workflow.status = 'completed'
        workflow.last_run = timezone.now()
        workflow.save()
        
        return {
            'status': 'completed',
            'workflow_id': str(workflow_id),
            'results': results
        }
        
    except Workflow.DoesNotExist:
        return {'status': 'error', 'error': 'Workflow not found'}
    except Exception as e:
        logger.error(f"Workflow execution failed: {str(e)}")
        try:
            workflow = Workflow.objects.get(id=workflow_id)
            workflow.status = 'failed'
            workflow.save()
        except:
            pass
        return {'status': 'error', 'error': str(e)}


def topological_sort(nodes, edges):
    """Sort nodes in dependency order."""
    from collections import deque
    
    # Build adjacency list and in-degree count
    adj = {n.get('id'): [] for n in nodes}
    in_degree = {n.get('id'): 0 for n in nodes}
    
    for edge in edges:
        source = edge.get('source')
        target = edge.get('target')
        if source in adj and target in in_degree:
            adj[source].append(target)
            in_degree[target] += 1
    
    # BFS
    queue = deque([n for n, d in in_degree.items() if d == 0])
    result = []
    
    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in adj.get(node, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    return result


def execute_transformation_node(node_data):
    """Execute a transformation node."""
    from .models import Transformation
    
    transformation_id = node_data.get('transformation_id')
    if not transformation_id:
        return {'status': 'error', 'error': 'No transformation ID specified'}
    
    try:
        transformation = Transformation.objects.get(id=transformation_id)
        # Trigger transformation execution
        # This would call the transformation's execute method
        return {'status': 'success', 'transformation': transformation.name}
    except Transformation.DoesNotExist:
        return {'status': 'error', 'error': 'Transformation not found'}


def execute_quality_check_node(node_data):
    """Execute a quality check node."""
    from .models import DataQualityCheck
    
    check_id = node_data.get('quality_check_id')
    if not check_id:
        return {'status': 'error', 'error': 'No quality check ID specified'}
    
    try:
        check = DataQualityCheck.objects.get(id=check_id)
        # Trigger quality check execution
        return {'status': 'success', 'check': check.name}
    except DataQualityCheck.DoesNotExist:
        return {'status': 'error', 'error': 'Quality check not found'}


def execute_notification_node(node_data):
    """Execute a notification node."""
    notification_type = node_data.get('type', 'email')
    recipients = node_data.get('recipients', [])
    message = node_data.get('message', '')
    
    # Send notification
    if notification_type == 'email':
        from django.core.mail import send_mail
        try:
            send_mail(
                subject='Workflow Notification',
                message=message,
                from_email=None,
                recipient_list=recipients,
                fail_silently=True
            )
            return {'status': 'success', 'type': 'email', 'recipients': len(recipients)}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    return {'status': 'success', 'type': notification_type}
