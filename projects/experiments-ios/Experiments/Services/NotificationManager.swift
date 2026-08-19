//
//  NotificationManager.swift
//  Experiments
//
//  Manages local notification scheduling.
//

import Foundation
import UserNotifications

/// Singleton for managing local notifications.
@MainActor
class NotificationManager: ObservableObject {
    
    static let shared = NotificationManager()
    
    @Published var isAuthorized = false
    
    private init() {}
    
    // MARK: - Authorization
    
    func requestAuthorization() async {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
            isAuthorized = granted
        } catch {
            print("Notification authorization error: \(error)")
        }
    }
    
    func checkAuthorization() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        isAuthorized = settings.authorizationStatus == .authorized
    }
    
    // MARK: - Scheduling
    
    /// Schedules all reminders for an experiment.
    func scheduleReminders(for experiment: Experiment) {
        // Cancel existing reminders first
        cancelReminders(for: experiment)
        
        guard experiment.status == .active else { return }
        
        for reminder in experiment.reminders where reminder.isEnabled {
            scheduleReminder(reminder, for: experiment)
        }
    }
    
    private func scheduleReminder(_ reminder: Reminder, for experiment: Experiment) {
        let content = UNMutableNotificationContent()
        content.title = experiment.title
        content.body = "Time to check in on your experiment!"
        content.sound = .default
        content.userInfo = [
            "experimentId": experiment.id.uuidString,
            "action": "checkin"
        ]
        
        for weekday in reminder.repeatDays {
            var dateComponents = DateComponents()
            dateComponents.weekday = weekday
            dateComponents.hour = reminder.hour
            dateComponents.minute = reminder.minute
            
            let trigger = UNCalendarNotificationTrigger(
                dateMatching: dateComponents,
                repeats: true
            )
            
            let identifier = "\(experiment.id.uuidString)-\(reminder.id.uuidString)-\(weekday)"
            let request = UNNotificationRequest(
                identifier: identifier,
                content: content,
                trigger: trigger
            )
            
            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("Error scheduling notification: \(error)")
                }
            }
        }
    }
    
    /// Cancels all reminders for an experiment.
    func cancelReminders(for experiment: Experiment) {
        let identifiers = experiment.reminders.flatMap { reminder in
            reminder.repeatDays.map { weekday in
                "\(experiment.id.uuidString)-\(reminder.id.uuidString)-\(weekday)"
            }
        }
        
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: identifiers)
    }
    
    /// Cancels all notifications for the app.
    func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}

// MARK: - Deep Link Handling

extension NotificationManager {
    
    /// Parses a notification's userInfo to extract deep link information.
    static func parseDeepLink(from userInfo: [AnyHashable: Any]) -> DeepLink? {
        guard let experimentIdString = userInfo["experimentId"] as? String,
              let experimentId = UUID(uuidString: experimentIdString) else {
            return nil
        }
        
        let action = userInfo["action"] as? String
        
        if action == "checkin" {
            return .experimentCheckIn(experimentId)
        } else {
            return .experiment(experimentId)
        }
    }
}

/// Deep link destinations for navigation.
enum DeepLink: Hashable {
    case experiment(UUID)
    case experimentCheckIn(UUID)
    case gallery
    case settings
}
