<?php
// Check if this is a BBQ page
$isBBQPage = strpos($_SERVER['REQUEST_URI'], '/bbq') !== false || strpos($_SERVER['REQUEST_URI'], '/on-the-fire') !== false;

// Find the JS and CSS files dynamically
// Try multiple possible locations
$possibleDirs = [
  __DIR__ . '/assets',
  __DIR__ . '/dist/assets',
  dirname(__DIR__) . '/assets',
  dirname(__DIR__) . '/dist/assets'
];

$jsFile = null;
$cssFile = null;

foreach ($possibleDirs as $assetsDir) {
  if (is_dir($assetsDir)) {
    $files = scandir($assetsDir);
    foreach ($files as $file) {
      if (preg_match('/^index-.*\.js$/', $file)) {
        $jsFile = '/assets/' . $file;
      }
      if (preg_match('/^index-.*\.css$/', $file)) {
        $cssFile = '/assets/' . $file;
      }
    }
    if ($jsFile && $cssFile) {
      break;
    }
  }
}

// Fallback to known filenames if not found
if (!$jsFile) {
  $jsFile = '/assets/index-Dgfs010Z.js';
}
if (!$cssFile) {
  $cssFile = '/assets/index-DtaJk1Ge.css';
}

if ($isBBQPage) {
  // BBQ page meta tags
  $title = 'כלי לניהול קבוצות ותשלומים';
  $description = 'כלי לניהול תשלומים, חברים וקבוצות. ניהול פשוט ויעיל לכל האירועים שלכם.';
  $url = 'https://ophir.travelsure.co.il/bbq';
  $author = 'כלי לניהול קבוצות ותשלומים';
  $keywords = 'ניהול אירועים, תשלומים, קבוצות, BBQ';
  $image = 'https://storage.googleapis.com/gpt-engineer-file-uploads/q3iGkYfOr8SjXG6j6dVfK26pWLf1/social-images/social-1767182146432-לוגו אופיר חדש.png';
} else {
  // Home page meta tags
  $title = 'אופיר ושות׳ סוכנות לביטוח | ביטוח נסיעות לחו״ל, עסקים, דירות ורכב';
  $description = 'ביטוח נסיעות לחו״ל עם סוכן אישי וצמוד. כיסוי עד 5 מיליון דולר, שירות 24/7. ביטוח עסקים, דירות ורכב.';
  $url = 'https://ophir.travelsure.co.il/';
  $author = 'אופיר ושות׳ סוכנות לביטוח';
  $keywords = 'ביטוח נסיעות, ביטוח לחול, ביטוח עסקים, ביטוח דירות, ביטוח רכב, סוכנות ביטוח';
  $image = 'https://storage.googleapis.com/gpt-engineer-file-uploads/q3iGkYfOr8SjXG6j6dVfK26pWLf1/social-images/social-1767182146432-לוגו אופיר חדש.png';
}
?>
<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></title>
    <meta name="description" content="<?php echo htmlspecialchars($description, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="author" content="<?php echo htmlspecialchars($author, ENT_QUOTES, 'UTF-8'); ?>" />
    <meta name="keywords" content="<?php echo htmlspecialchars($keywords, ENT_QUOTES, 'UTF-8'); ?>">

    <meta property="og:type" content="website" />
    <meta property="og:url" content="<?php echo htmlspecialchars($url, ENT_QUOTES, 'UTF-8'); ?>" />
    <meta property="og:image" content="<?php echo htmlspecialchars($image, ENT_QUOTES, 'UTF-8'); ?>">

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@ofir_insurance" />
    <meta name="twitter:image" content="<?php echo htmlspecialchars($image, ENT_QUOTES, 'UTF-8'); ?>">
    <meta property="og:title" content="<?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="twitter:title" content="<?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?>">
    <meta property="og:description" content="<?php echo htmlspecialchars($description, ENT_QUOTES, 'UTF-8'); ?>">
    <meta name="twitter:description" content="<?php echo htmlspecialchars($description, ENT_QUOTES, 'UTF-8'); ?>">
  
    <script>
      // Update meta tags dynamically based on pathname and localStorage
      function updateMetaTagsFromStorage() {
        try {
          const pathname = window.location.pathname;
          const isBBQPage = pathname === '/bbq' || pathname === '/on-the-fire' || pathname.startsWith('/bbq/') || pathname.startsWith('/on-the-fire/');
          
          // Helper function to update or create meta tag
          const updateMeta = (property, content, attribute = 'property') => {
            let meta = document.querySelector(`meta[${attribute}="${property}"]`);
            if (!meta) {
              meta = document.createElement('meta');
              meta.setAttribute(attribute, property);
              document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
          };
          
          if (isBBQPage) {
            // BBQ page - check for group in localStorage
            const savedGroup = localStorage.getItem('bbq_current_group');
            
            if (savedGroup) {
              try {
                const group = JSON.parse(savedGroup);
                if (group && group.name) {
                  // Update with group-specific data
                  const title = group.name;
                  const description = `כלי לניהול קבוצות ותשלומים - ${group.name}`;
                  const imageUrl = group.group_image || '<?php echo htmlspecialchars($image, ENT_QUOTES, 'UTF-8'); ?>';
                  
                  document.title = title;
                  updateMeta('og:title', title);
                  updateMeta('twitter:title', title, 'name');
                  updateMeta('og:description', description);
                  updateMeta('twitter:description', description, 'name');
                  updateMeta('description', description, 'name');
                  updateMeta('og:image', imageUrl);
                  updateMeta('twitter:image', imageUrl, 'name');
                  updateMeta('og:url', window.location.href);
                  return;
                }
              } catch (e) {
                // If parsing fails, continue with default BBQ meta
              }
            }
            
            // Default BBQ meta tags (no group found) - already set by PHP, no need to update
          } else {
            // Home page or other pages - already set by PHP, no need to update
          }
        } catch (e) {
          // Silently fail if localStorage is not available or parsing fails
          console.error('Error updating meta tags:', e);
        }
      }
      
      // Run immediately if DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateMetaTagsFromStorage);
      } else {
        updateMetaTagsFromStorage();
      }
    </script>
    <link rel="icon" type="image/png" href="https://storage.googleapis.com/gpt-engineer-file-uploads/q3iGkYfOr8SjXG6j6dVfK26pWLf1/uploads/1767182158604-לוגו אופיר חדש.png">
    <?php if ($jsFile): ?>
    <script type="module" crossorigin src="<?php echo htmlspecialchars($jsFile, ENT_QUOTES, 'UTF-8'); ?>"></script>
    <?php endif; ?>
    <?php if ($cssFile): ?>
    <link rel="stylesheet" crossorigin href="<?php echo htmlspecialchars($cssFile, ENT_QUOTES, 'UTF-8'); ?>">
    <?php endif; ?>
  </head>

  <body>
    <div id="root"></div>
  </body>
</html>
