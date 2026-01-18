//
//  EntryDetailView.swift
//  Experiments
//
//  Detail view for a single entry.
//

import SwiftUI

/// Detail view showing a single entry's content.
struct EntryDetailView: View {
    
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @Bindable var entry: Entry
    
    @State private var showingEdit = false
    @State private var showingDeleteAlert = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // MARK: - Status Card
                statusCard
                
                // MARK: - Note Section
                if let noteText = entry.noteText, !noteText.isEmpty {
                    noteSection(noteText)
                }
                
                // MARK: - Photo Section
                if entry.photoFileName != nil {
                    photoSection
                }
            }
            .padding(20)
        }
        .background(Color(.systemGray6))
        .navigationTitle(formattedDate)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Edit", systemImage: "pencil") {
                        showingEdit = true
                    }
                    Button("Delete", systemImage: "trash", role: .destructive) {
                        showingDeleteAlert = true
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingEdit) {
            EntryEditView(entry: entry)
        }
        .alert("Delete Entry?", isPresented: $showingDeleteAlert) {
            Button("Delete", role: .destructive) {
                modelContext.delete(entry)
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This action cannot be undone.")
        }
    }
    
    private var formattedDate: String {
        if let date = Date.fromLocalDateString(entry.scheduledDate) {
            return date.formatted(.dateTime.weekday(.wide).day().month())
        }
        return entry.scheduledDate
    }
    
    private var statusCard: some View {
        HStack {
            Image(systemName: entry.isCompleted ? "checkmark.circle.fill" : "xmark.circle.fill")
                .font(.title)
                .foregroundStyle(entry.isCompleted ? Color.green : Color.red)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.isCompleted ? "Completed" : "Missed")
                    .font(.headline)
                Text(formattedDate)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
        }
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
    
    private func noteSection(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Note")
                .font(.headline)
            
            Text(text)
                .font(.body)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
    
    private var photoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Photo")
                .font(.headline)
            
            // Photo would be loaded from file here
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemGray5))
                .aspectRatio(4/3, contentMode: .fit)
                .overlay {
                    Image(systemName: "photo")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
}

// MARK: - Entry Row View

struct EntryRowView: View {
    let entry: Entry
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: entry.isCompleted ? "checkmark.circle.fill" : "circle")
                .font(.title3)
                .foregroundStyle(entry.isCompleted ? Color.primary : .secondary)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(formattedDate)
                    .font(.subheadline.weight(.medium))
                
                if let note = entry.noteText, !note.isEmpty {
                    Text(note)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            
            Spacer()
            
            if entry.photoFileName != nil {
                Image(systemName: "photo")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    private var formattedDate: String {
        if let date = Date.fromLocalDateString(entry.scheduledDate) {
            return date.formatted(.dateTime.weekday(.abbreviated).day().month(.abbreviated))
        }
        return entry.scheduledDate
    }
}

#Preview {
    NavigationStack {
        EntryDetailView(
            entry: Entry(
                scheduledDate: Date().toLocalDateString(),
                isCompleted: true,
                noteText: "Great session today!"
            )
        )
    }
    .modelContainer(for: [Entry.self], inMemory: true)
}
