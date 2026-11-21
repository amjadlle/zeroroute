// One file per component group so parallel component PRs never edit the same file.
import ButtonsSection from "./buttons";
import FormControlsSection from "./forms";
import SurfacesSection from "./surfaces";
import NavigationSection from "./navigation";
import OverlaysSection from "./overlays";
import DataDisplaySection from "./data";
import ShellSection from "./shell";

export const SECTIONS = [
  { id: "buttons", title: "Buttons", Component: ButtonsSection },
  { id: "forms", title: "Form controls", Component: FormControlsSection },
  { id: "surfaces", title: "Surfaces and status", Component: SurfacesSection },
  { id: "navigation", title: "Tabs and segmented controls", Component: NavigationSection },
  { id: "overlays", title: "Modal, drawer and toast", Component: OverlaysSection },
  { id: "data", title: "Code, copy, secrets, tables and markdown", Component: DataDisplaySection },
  { id: "shell", title: "Console shell, page header and command palette", Component: ShellSection },
] as const;
