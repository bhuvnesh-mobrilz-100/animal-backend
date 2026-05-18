// utils/storage.ts
export const storage = {
    set: (key: string, value: any) => {
      if (typeof window === "undefined") return;
      sessionStorage.setItem(key, JSON.stringify(value));
    },
    get: (key: string) => {
      if (typeof window === "undefined") return null;
      try {
        const value = sessionStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },
    remove: (key: string) => {
      if (typeof window === "undefined") return;
      sessionStorage.removeItem(key);
    },
    clear: () => {
      if (typeof window === "undefined") return;
      sessionStorage.clear();
    },
    clearVendorData:()=>{
      if (typeof window === "undefined") return;
      sessionStorage.removeItem("selected_roles");
      sessionStorage.removeItem("selected_vendor");
      sessionStorage.removeItem("selected_vendor_location_id");
    }
  };
  