//
//  GalleryListView.swift
//  Experiments
//
//  Ideas Gallery showing experiment templates.
//

import SwiftUI

/// Gallery view showing pre-built experiment templates.
struct GalleryListView: View {
    
    @State private var templates = TemplateLoader.loadBundledTemplates()
    @State private var selectedTemplate: ExperimentTemplate?
    @State private var showingCreate = false
    
    private var groupedTemplates: [String: [ExperimentTemplate]] {
        Dictionary(grouping: templates, by: { $0.category })
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Ideas Gallery")
                        .font(.system(size: 36, weight: .bold))
                    
                    Text("Start from a template")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
                
                // Template Categories
                ForEach(groupedTemplates.keys.sorted(), id: \.self) { category in
                    VStack(alignment: .leading, spacing: 12) {
                        Text(category.uppercased())
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .tracking(1.5)
                            .padding(.horizontal, 20)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(groupedTemplates[category] ?? []) { template in
                                    TemplateCard(template: template) {
                                        selectedTemplate = template
                                        showingCreate = true
                                    }
                                }
                            }
                            .padding(.horizontal, 20)
                        }
                    }
                }
            }
            .padding(.bottom, 40)
        }
        .background(Color(.systemGray6))
        .navigationTitle("")
        .navigationBarHidden(true)
        .sheet(isPresented: $showingCreate) {
            if let template = selectedTemplate {
                ExperimentEditView(mode: .fromTemplate(template))
            }
        }
    }
}

// MARK: - Template Card

struct TemplateCard: View {
    let template: ExperimentTemplate
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Icon
                Image(systemName: template.icon)
                    .font(.title)
                    .frame(width: 44, height: 44)
                    .background(Color(.systemGray5))
                    .clipShape(Circle())
                
                // Content
                VStack(alignment: .leading, spacing: 4) {
                    Text(template.title)
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                    
                    Text("\(template.durationDays) days • \(template.frequency.displayName)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Start Button
                Text("Start")
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.primary)
                    .foregroundStyle(Color(.systemBackground))
                    .clipShape(Capsule())
            }
            .padding(16)
            .frame(width: 160, height: 200)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 20))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    NavigationStack {
        GalleryListView()
    }
    .modelContainer(for: [Experiment.self], inMemory: true)
}
