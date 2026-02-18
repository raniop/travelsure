<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$fullName = trim($data['fullName'] ?? '');
$phone = trim($data['phone'] ?? '');
$birthDate = trim($data['birthDate'] ?? '');
$idNumber = trim($data['idNumber'] ?? '');
$notes = trim($data['notes'] ?? '');

if ($fullName === '' || $phone === '' || $birthDate === '' || $idNumber === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

if (mb_strlen($fullName) > 100 || mb_strlen($phone) > 20 || mb_strlen($birthDate) > 20 || mb_strlen($idNumber) > 20 || mb_strlen($notes) > 2000) {
    http_response_code(400);
    echo json_encode(['error' => 'Fields too long']);
    exit;
}

$to = [
    'y@tiroche-ins.com',
    'rani@ophirins.co.il',
    'eli@ophirins.co.il',
    'ophir@ophirins.co.il'
];

$subject = 'ליד חדש - תירוש: ' . $fullName;

$safe = function ($value) {
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$message = "
<div dir=\"rtl\" style=\"font-family: Arial, sans-serif;\">
  <h2>ליד חדש - תירוש</h2>
  <p><strong>שם מלא:</strong> " . $safe($fullName) . "</p>
  <p><strong>טלפון:</strong> " . $safe($phone) . "</p>
  <p><strong>תאריך לידה:</strong> " . $safe($birthDate) . "</p>
  <p><strong>תעודת זהות:</strong> " . $safe($idNumber) . "</p>
  <p><strong>הערות:</strong></p>
  <p style=\"background:#f5f5f5;padding:10px;border-radius:6px;\">" . ($notes ? $safe($notes) : '—') . "</p>
</div>
";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-type: text/html; charset=UTF-8';
$headers[] = 'From: TravelSure <no-reply@travelsure.co.il>';
$headers[] = 'Reply-To: no-reply@travelsure.co.il';

$success = mail(implode(',', $to), $subject, $message, implode("\r\n", $headers));

if (!$success) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
    exit;
}

echo json_encode(['success' => true]);
