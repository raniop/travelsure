<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$id = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing id parameter']);
    exit;
}

// קריאה ל-XML
$xmlUrl = 'https://www.ophirbit.co.il/aff/XmlShatapim.asp';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $xmlUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/xml, text/xml, */*',
    'Accept-Language: he,en;q=0.9'
]);

$xmlText = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200 || empty($xmlText)) {
    http_response_code(502);
    echo json_encode(['error' => 'Failed to fetch XML', 'details' => $curlError ?: 'HTTP ' . $httpCode]);
    exit;
}

// חיפוש ה-ID ב-XML
$pattern = '/<ShatapItem>\s*<Id>(.*?)<\/Id>\s*<Name>(.*?)<\/Name>\s*<\/ShatapItem>/s';
preg_match_all($pattern, $xmlText, $matches, PREG_SET_ORDER);

foreach ($matches as $match) {
    $itemId = trim($match[1]);
    $itemName = trim($match[2]);
    
    if ($itemId === $id && !empty($itemName)) {
        // פיענוח HTML entities
        $itemName = html_entity_decode($itemName, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $itemName = preg_replace_callback('/&#(\d+);/', function($m) {
            return chr((int)$m[1]);
        }, $itemName);
        
        http_response_code(200);
        echo json_encode([
            'id' => $itemId,
            'name' => $itemName
        ]);
        exit;
    }
}

// לא נמצא
http_response_code(404);
echo json_encode(['error' => 'Shatap not found']);
?>
