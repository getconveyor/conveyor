/**
 * Lazy-loaded components for code splitting and performance optimization
 * These components are loaded on-demand to reduce initial bundle size
 */

import dynamic from "next/dynamic";
import { LoadingState } from "./loading-state";

/**
 * Lazy-loaded DataGrid component
 * Heavy component with AG Grid - only load when needed
 */
export const LazyDataGrid = dynamic(
  () => import("./data-grid").then((mod) => ({ default: mod.DataGrid })),
  {
    loading: () => <LoadingState message="Loading data grid..." />,
    ssr: false, // AG Grid doesn't support SSR well
  }
);

/**
 * Lazy-loaded Pipeline Builder
 * Heavy component with React Flow - only load when needed
 */
export const LazyPipelineBuilder = dynamic(
  () => import("./pipeline-builder").then((mod) => ({ default: mod.PipelineBuilder })),
  {
    loading: () => <LoadingState message="Loading pipeline builder..." />,
    ssr: false, // React Flow doesn't support SSR
  }
);

/**
 * Lazy-loaded Code Editor
 * Heavy component with Monaco/CodeMirror - only load when needed
 */
export const LazyCodeEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => ({ default: mod.default })),
  {
    loading: () => <LoadingState message="Loading code editor..." />,
    ssr: false,
  }
);

/**
 * Lazy-loaded Chart components
 * Recharts is heavy - only load when needed
 */
export const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => <LoadingState size="sm" />,
    ssr: false,
  }
);

export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.BarChart })),
  {
    loading: () => <LoadingState size="sm" />,
    ssr: false,
  }
);

export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.PieChart })),
  {
    loading: () => <LoadingState size="sm" />,
    ssr: false,
  }
);
