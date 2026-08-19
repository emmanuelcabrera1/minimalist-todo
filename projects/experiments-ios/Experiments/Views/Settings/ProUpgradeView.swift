//
//  ProUpgradeView.swift
//  Experiments
//
//  In-app purchase view for Pro upgrade.
//

import SwiftUI
import StoreKit

/// View for upgrading to Pro tier.
struct ProUpgradeView: View {
    
    @Environment(\.dismiss) private var dismiss
    @StateObject private var storeManager = StoreKitManager.shared
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: "flask.fill")
                            .font(.system(size: 60))
                        
                        Text("Experiments Pro")
                            .font(.title.bold())
                        
                        Text("Unlock your full potential")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 40)
                    
                    // Features
                    VStack(alignment: .leading, spacing: 16) {
                        FeatureRow(icon: "infinity", title: "Unlimited Experiments", description: "Run as many experiments as you want")
                        FeatureRow(icon: "photo.stack", title: "Photo Attachments", description: "Add photos to your check-ins")
                        FeatureRow(icon: "bell.badge", title: "Unlimited Reminders", description: "Set multiple reminders per experiment")
                        FeatureRow(icon: "square.grid.2x2", title: "All Widgets", description: "Access to all widget types")
                        FeatureRow(icon: "icloud", title: "iCloud Sync", description: "Sync across all your devices")
                    }
                    .padding(.horizontal, 24)
                    
                    // Purchase Button
                    VStack(spacing: 12) {
                        Button {
                            Task {
                                await storeManager.purchase()
                            }
                        } label: {
                            Text("Upgrade for $4.99")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(Color.primary)
                                .foregroundStyle(Color(.systemBackground))
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                        }
                        
                        Button("Restore Purchases") {
                            Task {
                                await storeManager.restore()
                            }
                        }
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal, 24)
                    
                    // Terms
                    Text("One-time purchase. No subscription.")
                        .font(.caption)
                        .foregroundStyle(.tertiary)
                }
                .padding(.bottom, 40)
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Feature Row

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .frame(width: 44, height: 44)
                .background(Color(.systemGray6))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.medium))
                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

#Preview {
    ProUpgradeView()
}
