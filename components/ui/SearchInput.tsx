import { Search } from "lucide-react";
import { Input, type InputProps } from "./Input";

/** type="search" input with a leading search icon. Label it with Field or aria-label. */
export function SearchInput(props: Omit<InputProps, "type" | "leftIcon">) {
  return <Input type="search" leftIcon={<Search />} {...props} />;
}
