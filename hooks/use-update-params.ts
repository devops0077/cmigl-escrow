import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

// Types for better TypeScript support
type ParamValue = string | number | boolean | null | undefined;
type ParamObject = Record<string, ParamValue>;

interface UpdateParamsOptions {
  replace?: boolean; // Use router.replace instead of router.push
  scroll?: boolean; // Control scroll behavior
  shallow?: boolean; // For pages router compatibility
}

/**
 * Utility function to update URL search parameters
 */
export function useUpdateParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Create a new URLSearchParams instance from current params
  const createUpdatedParams = useCallback(
    (updates: ParamObject) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          // Remove parameter if value is null, undefined, or empty string
          params.delete(key);
        } else {
          // Set parameter with string conversion
          params.set(key, String(value));
        }
      });

      return params;
    },
    [searchParams]
  );

  // Single parameter update
  const updateParam = useCallback(
    (key: string, value: ParamValue, options: UpdateParamsOptions = {}) => {
      const { replace = false, scroll = true } = options;
      const params = createUpdatedParams({ [key]: value });
      const url = `${pathname}?${params.toString()}`;

      if (replace) {
        router.replace(url, { scroll });
      } else {
        router.push(url, { scroll });
      }
    },
    [router, pathname, createUpdatedParams]
  );

  // Multiple parameters update
  const updateParams = useCallback(
    (updates: ParamObject, options: UpdateParamsOptions = {}) => {
      const { replace = false, scroll = true } = options;
      const params = createUpdatedParams(updates);
      const url = `${pathname}?${params.toString()}`;

      if (replace) {
        router.replace(url, { scroll });
      } else {
        router.push(url, { scroll });
      }
    },
    [router, pathname, createUpdatedParams]
  );

  // Remove specific parameters
  const removeParams = useCallback(
    (keys: string | string[], options: UpdateParamsOptions = {}) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      const updates = keysArray.reduce((acc, key) => {
        acc[key] = null;
        return acc;
      }, {} as ParamObject);

      updateParams(updates, options);
    },
    [updateParams]
  );

  // Clear all parameters
  const clearParams = useCallback(
    (options: UpdateParamsOptions = {}) => {
      const { replace = false, scroll = true } = options;

      if (replace) {
        router.replace(pathname, { scroll });
      } else {
        router.push(pathname, { scroll });
      }
    },
    [router, pathname]
  );

  // Get current parameter value with type safety
  const getParam = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  // Get multiple parameters as an object
  const getParams = useCallback(
    (keys: string[]): Record<string, string | null> => {
      return keys.reduce(
        (acc, key) => {
          acc[key] = searchParams.get(key);
          return acc;
        },
        {} as Record<string, string | null>
      );
    },
    [searchParams]
  );

  // Check if a parameter exists
  const hasParam = useCallback(
    (key: string): boolean => {
      return searchParams.has(key);
    },
    [searchParams]
  );

  // Toggle a boolean parameter
  const toggleParam = useCallback(
    (key: string, options: UpdateParamsOptions = {}) => {
      const currentValue = getParam(key);
      const newValue = currentValue === "true" ? null : "true";
      updateParam(key, newValue, options);
    },
    [getParam, updateParam]
  );

  // Build URL string without navigation (useful for links)
  const buildUrl = useCallback(
    (updates: ParamObject): string => {
      const params = createUpdatedParams(updates);
      return `${pathname}?${params.toString()}`;
    },
    [pathname, createUpdatedParams]
  );

  return {
    // Core functions
    updateParam,
    updateParams,
    removeParams,
    clearParams,

    // Getters
    getParam,
    getParams,
    hasParam,

    // Utilities
    toggleParam,
    buildUrl,

    // Direct access to current state
    currentParams: searchParams,
    pathname,
  };
}

// Alternative standalone functions for use outside of components
export const urlParamsUtils = {
  /**
   * Create a URL with updated parameters
   */
  buildUrlWithParams: (baseUrl: string, updates: ParamObject): string => {
    const url = new URL(baseUrl, window.location.origin);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  },

  /**
   * Parse current URL parameters
   */
  getCurrentParams: (): Record<string, string> => {
    if (typeof window === "undefined") return {};

    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};

    params.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  },

  /**
   * Create URLSearchParams from object
   */
  createSearchParams: (params: ParamObject): URLSearchParams => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    });

    return searchParams;
  },
};

// Example usage with TypeScript generics for better type safety
export function useTypedParams<T extends Record<string, string>>() {
  const { getParam, getParams, updateParams } = useUpdateParams();

  return {
    getTypedParam: <K extends keyof T>(key: K): T[K] | null => {
      return getParam(key as string) as T[K] | null;
    },

    getTypedParams: <K extends keyof T>(keys: K[]): Pick<T, K> => {
      const params = getParams(keys as string[]);
      return params as Pick<T, K>;
    },

    updateTypedParams: (updates: Partial<T>, options?: UpdateParamsOptions) => {
      updateParams(updates as ParamObject, options);
    },
  };
}
