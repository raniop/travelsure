<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid JSON']);
  exit;
}

$summary = $data['foreignersPayload'] ?? $data['summary'] ?? [];
if (!is_array($summary)) $summary = [];

$fullName = trim((string)($data['fullName'] ?? trim(($summary['firstName'] ?? '') . ' ' . ($summary['lastName'] ?? ''))));
$employerName = trim((string)($data['employerName'] ?? ($summary['employerName'] ?? '')));
$passportNo = trim((string)($data['passportNo'] ?? ($summary['passportNo'] ?? '')));
$email = trim((string)($data['email'] ?? ($summary['email'] ?? ($summary['employerEmail'] ?? ''))));
$phone = trim((string)($data['phone'] ?? ($summary['mobile'] ?? '')));

if ($fullName === '' || $employerName === '' || $passportNo === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Missing required fields']);
  exit;
}

$safe = function ($value) {
  return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$line = function ($label, $value) use ($safe) {
  $v = trim((string)$value);
  if ($v === '') return '';
  return '<tr><td style="padding:6px 0;color:#555;width:40%;"><strong>' . $safe($label) . '</strong></td><td style="padding:6px 0;">' . $safe($v) . '</td></tr>';
};

$rows = '';
$fields = [
  'שם העובד' => $fullName,
  'דרכון' => $passportNo,
  'מעסיק' => $employerName,
  'טלפון' => $phone,
  'דוא״ל' => $email,
  'תקופת ביטוח מ־' => $summary['insuranceFrom'] ?? '',
  'תקופת ביטוח עד' => $summary['insuranceTo'] ?? '',
  'ספק שירות' => $summary['provider'] ?? '',
  'מטרת הגעה' => $summary['workPurpose'] ?? '',
  'כתובת עובד' => $summary['address'] ?? '',
  'נייד עובד' => $summary['mobile'] ?? '',
  'ת.ז. מעסיק' => $summary['employerId'] ?? '',
  'טלפון מעסיק' => $summary['employerPhone'] ?? '',
  'נייד מעסיק' => $summary['employerMobile'] ?? '',
  'דוא״ל מעסיק' => $summary['employerEmail'] ?? '',
  'כתובת מעסיק' => $summary['employerAddress'] ?? '',
  'שם חותם' => $summary['signatureName'] ?? '',
  'תאריך חתימה' => $summary['signatureDate'] ?? '',
  'דילוג תשלום' => $summary['skipPaymentNow'] ?? '',
  'משלם' => trim(($summary['payerFirstName'] ?? '') . ' ' . ($summary['payerLastName'] ?? '')),
  'ת.ז. משלם' => $summary['payerId'] ?? '',
  'כרטיס אשראי' => $summary['cardNumber'] ?? '',
  'תוקף' => $summary['cardExp'] ?? '',
  'הערות' => $summary['notes'] ?? '',
];

foreach ($fields as $label => $value) {
  $rows .= $line($label, $value);
}

$healthHtml = '';
if (!empty($summary['generalHealth']) && is_array($summary['generalHealth'])) {
  foreach ($summary['generalHealth'] as $item) {
    if (is_array($item) && count($item) >= 2) {
      $healthHtml .= $line((string)$item[0], (string)$item[1]);
    }
  }
}

$condHtml = '';
if (!empty($summary['conditions']) && is_array($summary['conditions'])) {
  foreach ($summary['conditions'] as $c) {
    if (!is_array($c)) continue;
    $parts = array_filter([
      $c['answer'] ?? '',
      !empty($c['selected']) ? ('בחירות: ' . $c['selected']) : '',
      !empty($c['details']) ? ('פירוט: ' . $c['details']) : '',
      $c['extras'] ?? '',
    ]);
    $condHtml .= $line((string)($c['group'] ?? 'שאלה'), implode(' | ', $parts));
  }
}

$html = '<div dir="rtl" style="font-family:Arial,sans-serif;">
  <h2>בקשה חדשה — ביטוח עובדים זרים</h2>
  <table style="width:100%;border-collapse:collapse;">' . $rows . '</table>';

if ($healthHtml !== '') {
  $html .= '<h3>הצהרת בריאות — כללי</h3><table style="width:100%;border-collapse:collapse;">' . $healthHtml . '</table>';
}
if ($condHtml !== '') {
  $html .= '<h3>הצהרת בריאות — מערכות</h3><table style="width:100%;border-collapse:collapse;">' . $condHtml . '</table>';
}
$html .= '<p style="color:#999;font-size:12px;">נשלח מ־/Foreigners באתר TravelSure (api-foreigners.php)</p></div>';

$to = ['rani@ophirins.co.il'];
$subject = 'ביטוח עובדים זרים: ' . $fullName . ' · ' . $employerName;

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=UTF-8';
$headers[] = 'From: TravelSure <noreply@travelsure.co.il>';
if ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
  $headers[] = 'Reply-To: ' . $email;
}

$ok = @mail(implode(',', $to), '=?UTF-8?B?' . base64_encode($subject) . '?=', $html, implode("\r\n", $headers));

if (!$ok) {
  http_response_code(500);
  echo json_encode(['error' => 'Mail failed']);
  exit;
}

echo json_encode(['success' => true]);
