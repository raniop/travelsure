<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method Not Allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid payload']);
  exit;
}

$name = trim((string)($data['name'] ?? ''));
$email = trim((string)($data['email'] ?? ''));
$phone = trim((string)($data['phone'] ?? ''));
$message = trim((string)($data['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
  http_response_code(400);
  echo json_encode(['error' => 'Missing required fields']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid email']);
  exit;
}

if (mb_strlen($name) > 100 || mb_strlen($email) > 255 || mb_strlen($message) > 5000) {
  http_response_code(400);
  echo json_encode(['error' => 'Input too long']);
  exit;
}

$safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safePhone = htmlspecialchars($phone, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$safeMessage = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

$to = 'ophir@ophirins.co.il';
$subject = 'פנייה חדשה מהאתר - TravelSure';

$body = "שם: {$safeName}\r\n";
$body .= "אימייל: {$safeEmail}\r\n";
$body .= "טלפון: " . ($safePhone !== '' ? $safePhone : 'לא צוין') . "\r\n";
$body .= "הודעה:\r\n{$safeMessage}\r\n";

$fromEmail = 'noreply@travelsure.co.il';
$headers = [];
$headers[] = 'From: TravelSure <' . $fromEmail . '>';
$headers[] = 'Reply-To: ' . $safeEmail;
$headers[] = 'Content-Type: text/plain; charset=UTF-8';

$sent = @mail($to, $subject, $body, implode("\r\n", $headers));

if (!$sent) {
  http_response_code(500);
  echo json_encode(['error' => 'Mail failed']);
  exit;
}

echo json_encode(['success' => true]);
