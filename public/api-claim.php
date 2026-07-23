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

$payloadRaw = $_POST['payload'] ?? '';
$payload = json_decode($payloadRaw, true);
if (!$payload || !is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

$requiredFields = ['claimTypeLabel', 'idNumber', 'email', 'incidentDate', 'details'];
foreach ($requiredFields as $field) {
    if (!isset($payload[$field]) || trim((string)$payload[$field]) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required field: ' . $field]);
        exit;
    }
}

$fullName = trim((string)($payload['fullName'] ?? ''));
if ($fullName === '') {
    $fullName = trim(((string)($payload['firstName'] ?? '')) . ' ' . ((string)($payload['lastName'] ?? '')));
}
if ($fullName === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required field: fullName']);
    exit;
}
$payload['fullName'] = $fullName;

if (!filter_var($payload['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

$escape = function ($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
};

$to = ['rani@ophirins.co.il', 'eli@ophirins.co.il'];
$subject = 'תביעה חדשה: ' . ($payload['claimTypeLabel'] ?? 'לא צוין') . ' - ' . ($payload['fullName'] ?? 'ללא שם');

$yesNo = function ($value) {
    if ($value === 'yes' || $value === true || $value === 'true') return 'כן';
    if ($value === 'no' || $value === false || $value === 'false') return 'לא';
    return is_string($value) ? $value : '';
};

$tripSubtypeLabel = '';
if (($payload['claimType'] ?? '') === 'trip_cancel' || ($payload['tripSubtype'] ?? '') === 'cancel') {
    $tripSubtypeLabel = 'ביטול נסיעה';
}
if (($payload['claimType'] ?? '') === 'trip_shorten' || ($payload['tripSubtype'] ?? '') === 'shorten') {
    $tripSubtypeLabel = 'קיצור נסיעה';
}

$fieldsMap = [
    'claimTypeLabel' => 'סוג תביעה',
    'tripSubtypeLabel' => 'ביטול / קיצור',
    'baggageSubtypeLabel' => 'סוג תביעת מטען',
    'fullName' => 'שם מלא',
    'lastName' => 'שם משפחה',
    'firstName' => 'שם פרטי',
    'idNumber' => 'תעודת זהות',
    'birthDate' => 'תאריך לידה',
    'street' => 'רחוב',
    'houseNumber' => 'מספר בית',
    'city' => 'יישוב',
    'zip' => 'מיקוד',
    'homePhone' => 'טלפון בבית',
    'mobile' => 'טלפון נייד',
    'phone' => 'טלפון',
    'email' => 'אימייל',
    'hmoName' => 'קופת חולים',
    'hmoBranch' => 'סניף קופ״ח',
    'hmoAddress' => 'כתובת סניף',
    'policyNumber' => 'מספר פוליסה',
    'selectedPolicyId' => 'פוליסה שנבחרה',
    'crmMatched' => 'זוהה ב-CRM',
    'crmCustomerName' => 'שם מ-CRM',
    'policyType' => 'סוג פוליסה',
    'purchasedWhere' => 'היכן נרכשה',
    'notifiedCreditCard' => 'הודעה לחברת אשראי',
    'creditCardPolicyNumber' => 'פוליסת אשראי',
    'medicalExtension' => 'הרחבה רפואית',
    'medicalExtensionPolicy' => 'מספר הרחבה',
    'claimedElsewhere' => 'תביעה לגורם אחר',
    'otherAbroadPolicy' => 'ביטוח חו״ל נוסף',
    'otherAbroadCompany' => 'שם חברה נוספת',
    'homeAllRisks' => 'ביטוח דירה כל הסיכונים',
    'originalsSubmittedElsewhere' => 'קבלות הוגשו לגורם אחר',
    'intendSubmitElsewhere' => 'כוונה להגיש לגורם אחר',
    'tripStartDate' => 'תאריך יציאה',
    'tripEndDate' => 'תאריך חזרה',
    'incidentDate' => 'תאריך מקרה',
    'country' => 'מדינה / מיקום',
    'location' => 'מיקום האירוע',
    'amount' => 'סכום תביעה',
    'totalClaimed' => 'סה״כ נתבע',
    'preexisting' => 'מחלה לפני יציאה',
    'preexistingDetails' => 'פירוט מחלה קודמת',
    'duringFlight' => 'אירע במסגרת טיסה',
    'claimedAirline' => 'תביעה לחברת תעופה',
    'airlineName' => 'שם חברת תעופה',
    'airlineCompensation' => 'פיצוי מחברת תעופה',
    'airlineCompensationAmount' => 'סכום פיצוי תעופה',
    'providerName' => 'מוסד רפואי / נותן שירות',
    'claimReason' => 'סיבת ביטול / קיצור',
    'bankName' => 'בנק',
    'branchName' => 'שם סניף',
    'branchNumber' => 'מספר סניף',
    'accountNumber' => 'מספר חשבון',
    'agentName' => 'שם סוכן',
    'authorizeAgent' => 'מינוי סוכן',
    'marketingConsent' => 'הסכמה שיווקית',
    'medicalWaiver' => 'ויתור סודיות רפואית',
    'declaration' => 'הצהרת נכונות',
    'details' => 'תיאור מפורט',
    'submittedAt' => 'נשלח בתאריך',
];

$payload['tripSubtypeLabel'] = $tripSubtypeLabel;
$payload['crmMatched'] = $yesNo($payload['crmMatched'] ?? '');
$payload['notifiedCreditCard'] = $yesNo($payload['notifiedCreditCard'] ?? '');
$payload['medicalExtension'] = $yesNo($payload['medicalExtension'] ?? '');
$payload['claimedElsewhere'] = $yesNo($payload['claimedElsewhere'] ?? '');
$payload['otherAbroadPolicy'] = $yesNo($payload['otherAbroadPolicy'] ?? '');
$payload['homeAllRisks'] = $yesNo($payload['homeAllRisks'] ?? '');
$payload['originalsSubmittedElsewhere'] = $yesNo($payload['originalsSubmittedElsewhere'] ?? '');
$payload['intendSubmitElsewhere'] = $yesNo($payload['intendSubmitElsewhere'] ?? '');
$payload['preexisting'] = $yesNo($payload['preexisting'] ?? '');
$payload['duringFlight'] = $yesNo($payload['duringFlight'] ?? '');
$payload['claimedAirline'] = $yesNo($payload['claimedAirline'] ?? '');
$payload['airlineCompensation'] = $yesNo($payload['airlineCompensation'] ?? '');
$payload['authorizeAgent'] = $yesNo($payload['authorizeAgent'] ?? '');
$payload['marketingConsent'] = $yesNo($payload['marketingConsent'] ?? '');
$payload['medicalWaiver'] = $yesNo($payload['medicalWaiver'] ?? '');
$payload['declaration'] = $yesNo($payload['declaration'] ?? '');

$rows = '';
foreach ($fieldsMap as $key => $label) {
    $value = isset($payload[$key]) ? trim((string)$payload[$key]) : '';
    if ($value === '') continue;
    $rows .= '<tr>'
        . '<td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>' . $escape($label) . '</strong></td>'
        . '<td style="padding:8px;border:1px solid #e2e8f0;">' . nl2br($escape($value)) . '</td>'
        . '</tr>';
}

if (!empty($payload['expenses']) && is_array($payload['expenses'])) {
    $expRows = '';
    foreach ($payload['expenses'] as $item) {
        if (!is_array($item)) continue;
        $line = trim(($item['date'] ?? '') . ' | ' . ($item['type'] ?? '') . ' | ' . ($item['amount'] ?? '') . ' | קבלה: ' . (!empty($item['receiptAttached']) ? 'כן' : 'לא'));
        if (trim(str_replace('|', '', str_replace('קבלה: לא', '', $line))) === '') continue;
        $expRows .= '<li>' . $escape($line) . '</li>';
    }
    if ($expRows !== '') {
        $rows .= '<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>פירוט הוצאות</strong></td><td style="padding:8px;border:1px solid #e2e8f0;"><ul>' . $expRows . '</ul></td></tr>';
    }
}

if (!empty($payload['baggageItems']) && is_array($payload['baggageItems'])) {
    $bagRows = '';
    foreach ($payload['baggageItems'] as $item) {
        if (!is_array($item)) continue;
        $line = trim(($item['item'] ?? '') . ' | ' . ($item['purchaseDate'] ?? '') . ' | ' . ($item['purchasePrice'] ?? '') . ' | קבלה: ' . (!empty($item['receiptAttached']) ? 'כן' : 'לא'));
        if (($item['item'] ?? '') === '') continue;
        $bagRows .= '<li>' . $escape($line) . '</li>';
    }
    if ($bagRows !== '') {
        $rows .= '<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>פירוט כבודה</strong></td><td style="padding:8px;border:1px solid #e2e8f0;"><ul>' . $bagRows . '</ul></td></tr>';
    }
}

$htmlBody = '<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;">'
    . '<h2 style="margin:0 0 12px;color:#0b4e86;">הוגשה תביעה חדשה באתר</h2>'
    . '<table style="border-collapse:collapse;width:100%;max-width:900px;">' . $rows . '</table>'
    . '</div>';

$boundary = '=_ClaimBoundary_' . md5((string)microtime(true));
$headers = [
    'MIME-Version: 1.0',
    'From: TravelSure <no-reply@travelsure.co.il>',
    'Reply-To: no-reply@travelsure.co.il',
    'Content-Type: multipart/mixed; boundary="' . $boundary . '"',
];

$message = '--' . $boundary . "\r\n";
$message .= "Content-Type: text/html; charset=UTF-8\r\n";
$message .= "Content-Transfer-Encoding: base64\r\n\r\n";
$message .= chunk_split(base64_encode($htmlBody)) . "\r\n";

$allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
$maxSingleFileBytes = 10 * 1024 * 1024; // 10MB

if (isset($_FILES['files'])) {
    $names = $_FILES['files']['name'] ?? [];
    $tmpNames = $_FILES['files']['tmp_name'] ?? [];
    $errors = $_FILES['files']['error'] ?? [];
    $sizes = $_FILES['files']['size'] ?? [];

    $count = is_array($names) ? count($names) : 0;
    for ($i = 0; $i < $count; $i++) {
        if (($errors[$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) continue;
        $tmpName = $tmpNames[$i] ?? '';
        $originalName = $names[$i] ?? 'attachment';
        $size = (int)($sizes[$i] ?? 0);
        if ($tmpName === '' || !is_uploaded_file($tmpName)) continue;
        if ($size <= 0 || $size > $maxSingleFileBytes) continue;

        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExtensions, true)) continue;

        $content = file_get_contents($tmpName);
        if ($content === false) continue;

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = $finfo ? finfo_file($finfo, $tmpName) : 'application/octet-stream';
        if ($finfo) finfo_close($finfo);
        if (!$mimeType) $mimeType = 'application/octet-stream';

        $safeFilename = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($originalName));
        if ($safeFilename === '') $safeFilename = 'attachment_' . ($i + 1);

        $message .= '--' . $boundary . "\r\n";
        $message .= 'Content-Type: ' . $mimeType . '; name="' . $safeFilename . '"' . "\r\n";
        $message .= "Content-Transfer-Encoding: base64\r\n";
        $message .= 'Content-Disposition: attachment; filename="' . $safeFilename . '"' . "\r\n\r\n";
        $message .= chunk_split(base64_encode($content)) . "\r\n";
    }
}

$message .= '--' . $boundary . "--\r\n";

$sent = mail(implode(',', $to), '=?UTF-8?B?' . base64_encode($subject) . '?=', $message, implode("\r\n", $headers));

if (!$sent) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email']);
    exit;
}

echo json_encode(['success' => true]);
