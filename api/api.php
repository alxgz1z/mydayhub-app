<?php
/**
* api.php (Wrapper/Error Handler)
* This is a thin wrapper around the main API logic. It:
* 
* - Sets up error logging to /tmp/php_app.log
* - Uses output buffering (ob_start())
* - Wraps the main API logic in a try-catch block
* - Catches any throwable (including fatal errors, exceptions, etc.)
* - Returns structured JSON error responses when something goes wrong
* - Provides detailed error information including file/line numbers
*
* @version 7.0.0
* @author Alex & Gemini & Claude
*/


declare(strict_types=1);
ini_set("log_errors","1");
ini_set("error_log","/tmp/php_app.log");
error_reporting(E_ALL);
ob_start();
try {
  require __DIR__ . "/api.app.php";
} catch (Throwable $e) {
  http_response_code(500);
  header("Content-Type: application/json");
  $out = [
    "status"  => "error",
    "where"   => "api.php wrapper",
    "type"    => get_class($e),
    "message" => $e->getMessage(),
    "file"    => $e->getFile(),
    "line"    => $e->getLine()
  ];
  echo json_encode($out);
  error_log("API500: ".$e->getMessage()." @ ".$e->getFile().":".$e->getLine());
  if (ob_get_level()) { ob_end_flush(); }
}
