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
    $errorDetails = [
        'error' => 'Internal server error',
        'details' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    echo json_encode($errorDetails, JSON_UNESCAPED_UNICODE);
} catch (Error $e) {
    http_response_code(500);
    $errorDetails = [
        'error' => 'Internal server error',
        'details' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ];
    echo json_encode($errorDetails, JSON_UNESCAPED_UNICODE);
}

function handleGet($entity, $id, $groupId, $eventId, $dataFolder) {
    switch (strtolower($entity)) {
        case 'groups':
            if (!empty($id)) {
                $group = loadEntity($dataFolder, 'groups', $id);
                if ($group) {
                    echo json_encode($group, JSON_UNESCAPED_UNICODE);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
                }
            } else {
                $groups = loadAll($dataFolder, 'groups');
                echo json_encode($groups, JSON_UNESCAPED_UNICODE);
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

        case 'polls':
            $polls = loadAll($dataFolder, 'polls');
            if (!empty($groupId)) {
                $polls = array_filter($polls, function($p) use ($groupId) {
                    return $p['group_id'] === $groupId;
                });
                $polls = array_values($polls);
            }
            if (!empty($id)) {
                $polls = array_filter($polls, function($p) use ($id) {
                    return $p['id'] === $id;
                });
                $polls = array_values($polls);
                if (count($polls) > 0) {
                    echo json_encode($polls[0], JSON_UNESCAPED_UNICODE);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Not found'], JSON_UNESCAPED_UNICODE);
                }
            } else {
                echo json_encode($polls, JSON_UNESCAPED_UNICODE);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid entity']);
            break;
    }
}

function handlePost($entity, $dataFolder) {
    global $action;
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);

    // Handle action=update and action=delete via POST
    if ($action === 'update' && !empty($_GET['id'])) {
        handlePut($entity, $_GET['id'], $dataFolder);
        return;
    }
    
    if ($action === 'delete' && !empty($_GET['id'])) {
        handleDelete($entity, $_GET['id'], $dataFolder);
        return;
    }

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

        case 'polls':
            // Handle vote action
            if ($action === 'vote') {
                $pollId = $data['poll_id'] ?? '';
                $optionId = $data['option_id'] ?? '';
                $memberId = $data['member_id'] ?? '';
                
                if (empty($pollId) || empty($optionId) || empty($memberId)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Missing required fields: poll_id, option_id, member_id']);
                    return;
                }
                
                $poll = loadEntity($dataFolder, 'polls', $pollId);
                if (!$poll) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Poll not found']);
                    return;
                }
                
                // Initialize votes array if not exists
                if (!isset($poll['votes'])) {
                    $poll['votes'] = [];
                }
                
                // Remove existing vote from this member (if any)
                $poll['votes'] = array_filter($poll['votes'], function($v) use ($memberId) {
                    return $v['member_id'] !== $memberId;
                });
                $poll['votes'] = array_values($poll['votes']);
                
                // Add new vote
                $poll['votes'][] = [
                    'id' => uniqid(),
                    'option_id' => $optionId,
                    'member_id' => $memberId,
                    'voted_at' => date('c')
                ];
                
                saveEntity($dataFolder, 'polls', $pollId, $poll);
                echo json_encode($poll, JSON_UNESCAPED_UNICODE);
                return;
            }
            
            // Create new poll
            $data['id'] = uniqid();
            $data['created_at'] = date('c');
            if (!isset($data['options'])) {
                $data['options'] = [];
            }
            if (!isset($data['votes'])) {
                $data['votes'] = [];
            }
            if (!isset($data['is_active'])) {
                $data['is_active'] = true;
            }
            saveEntity($dataFolder, 'polls', $data['id'], $data);
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
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

        case 'polls':
            if (isset($data['updated_at'])) {
                $data['updated_at'] = date('c');
            }
            saveEntity($dataFolder, 'polls', $id, $data);
            echo json_encode($data, JSON_UNESCAPED_UNICODE);
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
