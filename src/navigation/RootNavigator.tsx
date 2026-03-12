import { NavigationContainer, NavigationState } from "@react-navigation/native";
import React, { useCallback } from "react";
import { lastRouteService } from "../services/lastRouteService";
import { useAppSelector } from "../stores/hooks";
import { AuthStack } from "./AuthStack";
import { MainStack } from "./MainStack";
import { navigationRef } from "./navigationRef";

/**
 * Recursively walk navigation state to find the leaf active route name + params.
 */
function getActiveLeafRoute(
  state: NavigationState | undefined,
): { name: string; params?: Record<string, unknown> } | null {
  if (!state) return null;
  const route = state.routes[state.index ?? 0];
  if (!route) return null;
  if (route.state) {
    return getActiveLeafRoute(route.state as NavigationState);
  }
  return {
    name: route.name,
    params: route.params as Record<string, unknown> | undefined,
  };
}

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  const onNavigationStateChange = useCallback(
    (state: NavigationState | undefined) => {
      if (!isAuthenticated) return; // never persist auth-stack routes
      const leaf = getActiveLeafRoute(state);
      if (leaf) {
        lastRouteService.save({ name: leaf.name, params: leaf.params });
      }
    },
    [isAuthenticated],
  );

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={onNavigationStateChange}
    >
      {isAuthenticated ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
