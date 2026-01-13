<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFolder = __DIR__ . '/data/bbq';

// Ensure data folder exists
if (!file_exists($dataFolder)) {
    mkdir($dataFolder, 0777, true);
}

$action = $_GET['action'] ?? '';
$entity = $_GET['entity'] ?? '';
$id = $_GET['id'] ?? '';
$groupId = $_GET['group_id'] ?? '';
$eventId = $_GET['event_id'] ?? '';

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGet($entity, $id, $groupId, $eventId, $dataFolder);
            break;
        case 'POST':
            handlePost($entity, $dataFolder);
            break;
        case 'PUT':
            handlePut($entity, $id, $dataFolder);
            break;
        case 'DELETE':
            handleDelete($entity, $id, $dataFolder);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'details' => $e->getMessage()]);
}

function handleGet($entity, $id, $groupId, $eventId, $dataFolder) {
    switch (strtolower($entity)) {
        case 'groups':
            if (!empty($id)) {
                $group = loadEntity($dataFolder, 'groups', $id);
                if ($group) {
                    echo json_encode($group);
                } else {
                    http_response_code(404);
                }
            } else {
                $groups = loadAll($dataFolder, 'groups');
                echo json_encode($groups);
            }
            break;

        case 'members':
            $members = loadAll($dataFolder, 'members');
            if (!empty($groupId)) {
                $members = array_filter($members, function($m) use ($groupId) {
                    return $m['group_id'] === $groupId;
                });
                $members = array_values($members);
            }
            echo json_encode($members);
            break;

        case 'events':
            $events = loadAll($dataFolder, 'events');
            if (!empty($groupId)) {
                $events = array_filter($events, function($e) use ($groupId) {
                    return $e['group_id'] === $groupId;
                });
                $events = array_values($events);
            }
            if (!empty($id)) {
                $events = array_filter($events, function($e) use ($id) {
                    return $e['id'] === $id;
                });
                $events = array_values($events);
            }
            echo json_encode($events);
            break;

        case 'attendees':
            $attendees = loadAll($dataFolder, 'attendees');
            if (!empty($eventId)) {
                $attendees = array_filter($attendees, function($a) use ($eventId) {
                    return $a['event_id'] === $eventId;
                });
                $attendees = array_values($attendees);
            }
            echo json_encode($attendees);
            break;

        case 'guests':
            $guests = loadAll($dataFolder, 'guests');
            if (!empty($eventId)) {
                $guests = array_filter($guests, function($g) use ($eventId) {
                    return $g['event_id'] === $eventId;
                });
                $guests = array_values($guests);
            }
            echo json_encode($guests);
            break;

        case 'payments':
            $payments = loadAll($dataFolder, 'payments');
            if (!empty($eventId)) {
                $payments = array_filter($payments, function($p) use ($eventId) {
                    return $p['event_id'] === $eventId;
                });
                $payments = array_values($payments);
            }
            echo json_encode($payments);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid entity']);
            break;
    }
}

function handlePost($entity, $dataFolder) {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);

    switch (strtolower($entity)) {
        case 'groups':
            $data['id'] = uniqid();
            $data['created_at'] = date('c');
            $data['updated_at'] = date('c');
            saveEntity($dataFolder, 'groups', $data['id'], $data);
            echo json_encode($data);
            break;

        case 'members':
            $data['id'] = uniqid();
            $data['created_at'] = date('c');
            saveEntity($dataFolder, 'members', $data['id'], $data);
            echo json_encode($data);
            break;

        case 'events':
            $data['id'] = uniqid();
            $data['created_at'] = date('c');
            $data['updated_at'] = date('c');
            saveEntity($dataFolder, 'events', $data['id'], $data);
            echo json_encode($data);
            break;

        case 'attendees':
            $data['id'] = uniqid();
            $data['created_at'] = date('c');
            saveEntity($dataFolder, 'attendees', $data['id'], $data);
            echo json_encode($data);
            break;

        case 'guests':
            $data['id'] = uniqid();
            $data['created_at'] = date('c');
            saveEntity($dataFolder, 'guests', $data['id'], $data);
            echo json_encode($data);
            break;

        case 'payments':
            $data['id'] = uniqid();
            $data['created_at'] = date('c');
            $data['updated_at'] = date('c');
            saveEntity($dataFolder, 'payments', $data['id'], $data);
            echo json_encode($data);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid entity']);
            break;
    }
}

function handlePut($entity, $id, $dataFolder) {
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id parameter']);
        return;
    }

    $body = file_get_contents('php://input');
    $data = json_decode($body, true);

    switch (strtolower($entity)) {
        case 'groups':
            $data['updated_at'] = date('c');
            saveEntity($dataFolder, 'groups', $id, $data);
            echo json_encode($data);
            break;

        case 'members':
        case 'attendees':
        case 'guests':
            saveEntity($dataFolder, $entity, $id, $data);
            echo json_encode($data);
            break;

        case 'events':
        case 'payments':
            $data['updated_at'] = date('c');
            saveEntity($dataFolder, $entity, $id, $data);
            echo json_encode($data);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid entity']);
            break;
    }
}

function handleDelete($entity, $id, $dataFolder) {
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing id parameter']);
        return;
    }

    $filePath = $dataFolder . '/' . $entity . '/' . $id . '.json';
    if (file_exists($filePath)) {
        unlink($filePath);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
    }
}

function loadEntity($dataFolder, $entity, $id) {
    $filePath = $dataFolder . '/' . $entity . '/' . $id . '.json';
    if (file_exists($filePath)) {
        $json = file_get_contents($filePath);
        return json_decode($json, true);
    }
    return null;
}

function loadAll($dataFolder, $entity) {
    $items = [];
    $folderPath = $dataFolder . '/' . $entity;
    if (file_exists($folderPath)) {
        $files = glob($folderPath . '/*.json');
        foreach ($files as $file) {
            $json = file_get_contents($file);
            $item = json_decode($json, true);
            if ($item) {
                $items[] = $item;
            }
        }
    }
    return $items;
}

function saveEntity($dataFolder, $entity, $id, $data) {
    $folderPath = $dataFolder . '/' . $entity;
    if (!file_exists($folderPath)) {
        mkdir($folderPath, 0777, true);
    }
    $filePath = $folderPath . '/' . $id . '.json';
    file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}
?>
