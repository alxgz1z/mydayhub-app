<?php
/**
 * Security Questions API
 * MyDayHub - Security Questions for Zero-Knowledge Recovery
 * @version 8.0 Herradura
 * @author Alex & Gemini & Claude & Cursor
 */

require_once __DIR__ . '/../incs/config.php';
require_once __DIR__ . '/../incs/db.php';

function handle_security_questions_action($action, $method, $pdo, $userId, $data) {
    switch ($action) {
        case 'setupQuestions':
            if ($method !== 'POST') {
                return ['success' => false, 'message' => 'Method not allowed'];
            }
            return handle_setup_security_questions($userId, $data, $pdo);
            
        case 'verifyQuestions':
            if ($method !== 'POST') {
                return ['success' => false, 'message' => 'Method not allowed'];
            }
            return handle_verify_security_questions($userId, $data, $pdo);
            
        case 'getQuestions':
            if ($method !== 'GET') {
                return ['success' => false, 'message' => 'Method not allowed'];
            }
            return handle_get_security_questions($userId, $pdo);
            
        default:
            return ['success' => false, 'message' => 'Unknown action: ' . $action];
    }
}

/**
 * Setup security questions for recovery
 */
function handle_setup_security_questions($userId, $data, $pdo) {
    try {
        $questions = $data['questions'] ?? [];
        $answers = $data['answers'] ?? [];
        
        if (count($questions) < 3 || count($answers) < 3) {
            return ['success' => false, 'message' => 'Exactly 3 security questions are required'];
        }
        
        if (count($questions) > 3 || count($answers) > 3) {
            return ['success' => false, 'message' => 'Maximum 3 security questions allowed'];
        }
        
        if (count($questions) !== count($answers)) {
            return ['success' => false, 'message' => 'Questions and answers count mismatch'];
        }
        
        // Validate questions and answers
        foreach ($questions as $question) {
            if (empty(trim($question)) || strlen($question) > 255) {
                return ['success' => false, 'message' => 'Invalid question format'];
            }
        }
        
        foreach ($answers as $answer) {
            if (empty(trim($answer)) || strlen($answer) > 100) {
                return ['success' => false, 'message' => 'Invalid answer format'];
            }
        }
        
        // Check for duplicate questions
        if (count($questions) !== count(array_unique($questions))) {
            return ['success' => false, 'message' => 'All security questions must be unique'];
        }
        
        // Check for duplicate answers
        if (count($answers) !== count(array_unique($answers))) {
            return ['success' => false, 'message' => 'All security answers must be unique'];
        }
        
        $pdo->beginTransaction();
        
        try {
            // Clear existing questions
            $stmt = $pdo->prepare("DELETE FROM user_security_questions WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Insert new questions
            $stmt = $pdo->prepare("
                INSERT INTO user_security_questions (user_id, question_text, question_hash, answer_hash, question_order)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            for ($i = 0; $i < count($questions); $i++) {
                $questionText = trim($questions[$i]);
                $questionHash = hash('sha256', $questionText);
                $answerHash = hash('sha256', strtolower(trim($answers[$i])));
                
                $stmt->execute([$userId, $questionText, $questionHash, $answerHash, $i + 1]);
            }
            
            $pdo->commit();
            
            return [
                'success' => true,
                'message' => 'Security questions setup successfully',
                'data' => ['questions_count' => count($questions)]
            ];
            
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
        
    } catch (Exception $e) {
        error_log("Security questions setup error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to setup security questions'];
    }
}

/**
 * Verify security question answers
 */
function handle_verify_security_questions($userId, $data, $pdo) {
    try {
        $answers = $data['answers'] ?? [];
        
        if (empty($answers)) {
            return ['success' => false, 'message' => 'Answers are required'];
        }
        
        // Get stored questions
        $stmt = $pdo->prepare("
            SELECT question_hash, answer_hash, question_order
            FROM user_security_questions
            WHERE user_id = ?
            ORDER BY question_order
        ");
        $stmt->execute([$userId]);
        $storedQuestions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($storedQuestions) === 0) {
            return ['success' => false, 'message' => 'No security questions found'];
        }
        
        if (count($answers) !== count($storedQuestions)) {
            return ['success' => false, 'message' => 'Answer count mismatch'];
        }
        
        // Verify each answer
        for ($i = 0; $i < count($storedQuestions); $i++) {
            $providedAnswer = hash('sha256', strtolower(trim($answers[$i])));
            $storedAnswer = $storedQuestions[$i]['answer_hash'];
            
            if ($providedAnswer !== $storedAnswer) {
                return ['success' => false, 'message' => 'Security question verification failed'];
            }
        }
        
        return [
            'success' => true,
            'message' => 'Security questions verified successfully',
            'data' => ['verified' => true]
        ];
        
    } catch (Exception $e) {
        error_log("Security questions verification error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to verify security questions'];
    }
}

/**
 * Get security questions for display
 */
function handle_get_security_questions($userId, $pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT question_text, question_order
            FROM user_security_questions
            WHERE user_id = ?
            ORDER BY question_order
        ");
        $stmt->execute([$userId]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($questions)) {
            return [
                'success' => true,
                'data' => ['has_questions' => false, 'questions' => []]
            ];
        }
        
        // Return questions (without answers)
        $questionData = array_map(function($q) {
            return [
                'question_text' => $q['question_text'],
                'question_order' => $q['question_order']
            ];
        }, $questions);
        
        return [
            'success' => true,
            'data' => [
                'has_questions' => true,
                'questions' => $questionData,
                'questions_count' => count($questions)
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Get security questions error: " . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to get security questions'];
    }
}
?>
