import { useEffect } from "react";

interface PWAConfig {
  name: string;
  groupImage?: string | null;
}

export const usePWAConfig = ({ name, groupImage }: PWAConfig) => {
  useEffect(() => {
    // Only update if name is valid
    if (!name || typeof name !== 'string') {
      return;
    }

    try {
      // Update manifest dynamically using data URI
      const updateManifest = () => {
        try {
          // Remove existing dynamic manifest link if exists
          const existingManifest = document.querySelector('link[rel="manifest"][data-dynamic]');
          if (existingManifest) {
            existingManifest.remove();
          }

          // Create new manifest with group data
          const manifestData = {
            name: name,
            short_name: name.length > 12 ? name.substring(0, 12) : name,
            description: `ניהול אירועי על האש - ${name}`,
            start_url: "/bbq",
            display: "standalone",
            background_color: "#fff7ed",
            theme_color: "#ea580c",
            orientation: "portrait",
            icons: [
              {
                src: groupImage || "/favicon.ico",
                sizes: groupImage ? "192x192" : "any",
                type: groupImage ? "image/jpeg" : "image/x-icon",
                purpose: "any maskable"
              },
              {
                src: groupImage || "https://storage.googleapis.com/gpt-engineer-file-uploads/q3iGkYfOr8SjXG6j6dVfK26pWLf1/uploads/1767182158604-לוגו אופיר חדש.png",
                sizes: "192x192",
                type: groupImage ? "image/jpeg" : "image/png",
                purpose: "any maskable"
              },
              {
                src: groupImage || "https://storage.googleapis.com/gpt-engineer-file-uploads/q3iGkYfOr8SjXG6j6dVfK26pWLf1/uploads/1767182158604-לוגו אופיר חדש.png",
                sizes: "512x512",
                type: groupImage ? "image/jpeg" : "image/png",
                purpose: "any maskable"
              }
            ],
            dir: "rtl",
            lang: "he"
          };

          // Create data URI for manifest
          const manifestJson = JSON.stringify(manifestData, null, 2);
          const manifestDataUri = `data:application/json;charset=utf-8,${encodeURIComponent(manifestJson)}`;

          // Create and append new manifest link
          const manifestLink = document.createElement("link");
          manifestLink.rel = "manifest";
          manifestLink.href = manifestDataUri;
          manifestLink.setAttribute("data-dynamic", "true");
          document.head.appendChild(manifestLink);
        } catch (error) {
          console.error("Error updating manifest:", error);
        }
      };

      // Update Apple meta tags
      const updateAppleMetaTags = () => {
        try {
          // Update apple-mobile-web-app-title
          let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
          if (!appleTitle) {
            appleTitle = document.createElement("meta");
            appleTitle.setAttribute("name", "apple-mobile-web-app-title");
            document.head.appendChild(appleTitle);
          }
          appleTitle.setAttribute("content", name.length > 12 ? name.substring(0, 12) : name);

          // Update apple-touch-icon if group image exists
          if (groupImage) {
            let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
            if (!appleIcon) {
              appleIcon = document.createElement("link");
              appleIcon.setAttribute("rel", "apple-touch-icon");
              document.head.appendChild(appleIcon);
            }
            appleIcon.setAttribute("href", groupImage);
          }
        } catch (error) {
          console.error("Error updating Apple meta tags:", error);
        }
      };

      // Update favicon
      const updateFavicon = () => {
        try {
          if (groupImage) {
            // Remove existing favicon
            const existingFavicon = document.querySelector('link[rel="icon"]');
            if (existingFavicon) {
              existingFavicon.remove();
            }

            // Create new favicon link
            const faviconLink = document.createElement("link");
            faviconLink.rel = "icon";
            faviconLink.type = "image/jpeg";
            faviconLink.href = groupImage;
            document.head.appendChild(faviconLink);
          }
        } catch (error) {
          console.error("Error updating favicon:", error);
        }
      };

      // Update document title
      const updateTitle = () => {
        try {
          document.title = name;
        } catch (error) {
          console.error("Error updating title:", error);
        }
      };

      // Execute all updates
      updateManifest();
      updateAppleMetaTags();
      updateFavicon();
      updateTitle();
    } catch (error) {
      console.error("Error in usePWAConfig:", error);
    }

    // Cleanup function
    return () => {
      try {
        // Cleanup blob URL when component unmounts
        const manifestLink = document.querySelector('link[rel="manifest"][data-dynamic]');
        if (manifestLink && manifestLink.getAttribute("href")?.startsWith("blob:")) {
          URL.revokeObjectURL(manifestLink.getAttribute("href") || "");
        }
      } catch (error) {
        console.error("Error in cleanup:", error);
      }
    };
  }, [name, groupImage]);
};
