use std::fs::{self};
use std::path::PathBuf;
use std::process::Command;
use serde::{Serialize, Deserialize};
use tauri::{AppHandle, Manager};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Message {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Session {
    pub id: String,
    pub title: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub messages: Vec<Message>,
    pub cli_session_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LiveKitCredentials {
    pub token: String,
    pub url: String,
}

fn get_sessions_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let mut path = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    path.push("sessions");
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
    Ok(path)
}

fn load_all_sessions(app_handle: &AppHandle) -> Result<Vec<Session>, String> {
    let dir = get_sessions_dir(app_handle)?;
    let mut sessions = Vec::new();
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Ok(file_content) = fs::read_to_string(path) {
                if let Ok(session) = serde_json::from_str::<Session>(&file_content) {
                    sessions.push(session);
                }
            }
        }
    }
    sessions.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(sessions)
}

fn save_session(app_handle: &AppHandle, session: &Session) -> Result<(), String> {
    let mut path = get_sessions_dir(app_handle)?;
    path.push(format!("{}.json", session.id));
    let serialized = serde_json::to_string_pretty(session).map_err(|e| e.to_string())?;
    fs::write(path, serialized).map_err(|e| e.to_string())?;
    Ok(())
}

fn get_hermes_path() -> Option<String> {
    let primary = "/home/will/.local/bin/hermes";
    if std::path::Path::new(primary).exists() {
        Some(primary.to_string())
    } else {
        if let Ok(output) = Command::new("which").arg("hermes").output() {
            if output.status.success() {
                let path_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !path_str.is_empty() {
                    return Some(path_str);
                }
            }
        }
        None
    }
}

fn get_latest_cli_session_id(hermes_bin: &str) -> Option<String> {
    let output = Command::new(hermes_bin)
        .args(&["sessions", "list"])
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let lines: Vec<&str> = stdout.lines().collect();
    if lines.len() > 2 {
        let first_data_line = lines[2];
        let words: Vec<&str> = first_data_line.split_whitespace().collect();
        if let Some(last_word) = words.last() {
            return Some(last_word.to_string());
        }
    }
    None
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn list_sessions(app_handle: AppHandle) -> Result<Vec<Session>, String> {
    load_all_sessions(&app_handle)
}

#[tauri::command]
fn create_session(app_handle: AppHandle, title: Option<String>) -> Result<Session, String> {
    let session = Session {
        id: Uuid::new_v4().to_string(),
        title: title.unwrap_or_else(|| "New Session".to_string()),
        created_at: Utc::now().timestamp_millis(),
        updated_at: Utc::now().timestamp_millis(),
        messages: Vec::new(),
        cli_session_id: None,
    };
    save_session(&app_handle, &session)?;
    Ok(session)
}

#[tauri::command]
fn get_session(app_handle: AppHandle, session_id: String) -> Result<Session, String> {
    let dir = get_sessions_dir(&app_handle)?;
    let session_path = dir.join(format!("{}.json", session_id));
    if !session_path.exists() {
        return Err("Session not found".to_string());
    }
    let file_content = fs::read_to_string(&session_path).map_err(|e| e.to_string())?;
    let session = serde_json::from_str::<Session>(&file_content).map_err(|e| e.to_string())?;
    Ok(session)
}

#[tauri::command]
async fn send_message(app_handle: AppHandle, session_id: String, text: String) -> Result<Message, String> {
    let dir = get_sessions_dir(&app_handle)?;
    let session_path = dir.join(format!("{}.json", session_id));
    if !session_path.exists() {
        return Err("Session not found".to_string());
    }
    let file_content = fs::read_to_string(&session_path).map_err(|e| e.to_string())?;
    let mut session = serde_json::from_str::<Session>(&file_content).map_err(|e| e.to_string())?;

    let user_msg = Message {
        id: Uuid::new_v4().to_string(),
        role: "user".to_string(),
        content: text.clone(),
        timestamp: Utc::now().timestamp_millis(),
    };
    session.messages.push(user_msg);
    session.updated_at = Utc::now().timestamp_millis();
    save_session(&app_handle, &session)?;

    let response_content = match get_hermes_path() {
        Some(hermes_bin) => {
            let mut cmd = Command::new(&hermes_bin);
            cmd.arg("-z").arg(&text);
            
            if let Some(ref cli_id) = session.cli_session_id {
                cmd.arg("-r").arg(cli_id);
            }

            let output = cmd.output().map_err(|e| format!("Failed to run hermes CLI: {}", e))?;
            
            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("Hermes CLI failed: {}", stderr));
            }

            let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();

            if session.cli_session_id.is_none() {
                if let Some(latest_id) = get_latest_cli_session_id(&hermes_bin) {
                    session.cli_session_id = Some(latest_id);
                }
            }

            stdout
        }
        None => {
            let mock_res = format!("This is a mock response from Hermes. (CLI not found in environment). You said: {}", text);
            std::thread::sleep(std::time::Duration::from_millis(500));
            mock_res
        }
    };

    let assistant_msg = Message {
        id: Uuid::new_v4().to_string(),
        role: "assistant".to_string(),
        content: response_content,
        timestamp: Utc::now().timestamp_millis(),
    };
    session.messages.push(assistant_msg.clone());
    session.updated_at = Utc::now().timestamp_millis();
    save_session(&app_handle, &session)?;

    Ok(assistant_msg)
}

#[tauri::command]
fn get_livekit_token() -> Result<LiveKitCredentials, String> {
    Ok(LiveKitCredentials {
        token: "mock-livekit-jwt-token-xyz".to_string(),
        url: "ws://localhost:7880".to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            list_sessions,
            create_session,
            get_session,
            send_message,
            get_livekit_token
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
