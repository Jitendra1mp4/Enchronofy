/**
 * A module-level navigation ref that gives non-component code (services)
 * access to the navigation container.  Import `navigationRef` wherever you
 * need to navigate imperatively.
 */
import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();
