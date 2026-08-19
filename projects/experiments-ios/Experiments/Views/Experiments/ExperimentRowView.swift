//
//  ExperimentRowView.swift
//  Experiments
//
//  Row component for experiment list items.
//

import SwiftUI

/// A row displaying an experiment's summary in the list.
struct ExperimentRowView: View {
    
    let experiment: Experiment
    
    var body: some View {
        HStack(spacing: 16) {
            // Progress Ring
            ProgressRingView(
                progress: experiment.progressPercentage,
                size: 60,
                lineWidth: 4
            )
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(experiment.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Text("\(experiment.daysCompleted) days completed")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            // Streak Badge
            if experiment.currentStreak > 0 {
                StreakBadgeView(streak: experiment.currentStreak)
            }
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
}

// MARK: - Progress Ring

struct ProgressRingView: View {
    let progress: Double
    var size: CGFloat = 60
    var lineWidth: CGFloat = 4
    
    var body: some View {
        ZStack {
            // Background ring
            Circle()
                .stroke(Color(.systemGray5), lineWidth: lineWidth)
            
            // Progress ring
            Circle()
                .trim(from: 0, to: progress)
                .stroke(Color.primary, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            
            // Percentage text
            Text("\(Int(progress * 100))%")
                .font(.system(size: size * 0.25, weight: .semibold, design: .rounded))
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Streak Badge

struct StreakBadgeView: View {
    let streak: Int
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "flame.fill")
                .font(.caption)
            Text("\(streak)")
                .font(.caption.bold())
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color(.systemGray5))
        .clipShape(Capsule())
    }
}

#Preview {
    ExperimentRowView(
        experiment: Experiment(
            title: "30 Days of Meditation",
            purpose: "Reduce stress",
            durationDays: 30
        )
    )
    .padding()
    .background(Color(.systemGray6))
}
