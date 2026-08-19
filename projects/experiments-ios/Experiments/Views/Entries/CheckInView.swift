//
//  CheckInView.swift
//  Experiments
//
//  Quick check-in modal for recording entries (ACT phase).
//

import SwiftUI
import PhotosUI

/// Modal view for recording a check-in entry.
struct CheckInView: View {
    
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    let experiment: Experiment
    
    @State private var selectedDate = Date()
    @State private var isCompleted = true
    @State private var noteText = ""
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var photoData: Data?
    
    var body: some View {
        NavigationStack {
            Form {
                // MARK: - Date
                Section("Date") {
                    DatePicker(
                        "Check-in Date",
                        selection: $selectedDate,
                        in: experiment.startDate...Date(),
                        displayedComponents: .date
                    )
                }
                
                // MARK: - Status
                Section("Status") {
                    Picker("Completed?", selection: $isCompleted) {
                        Text("Completed ✓").tag(true)
                        Text("Missed ✗").tag(false)
                    }
                    .pickerStyle(.segmented)
                }
                
                // MARK: - Note
                Section("Note (Optional)") {
                    TextField("How did it go?", text: $noteText, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                // MARK: - Photo
                Section("Photo (Optional)") {
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        if photoData != nil {
                            Label("Change Photo", systemImage: "photo")
                        } else {
                            Label("Add Photo", systemImage: "camera")
                        }
                    }
                    
                    if let photoData, let uiImage = UIImage(data: photoData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxHeight: 200)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            .navigationTitle("Check In")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveEntry()
                    }
                    .fontWeight(.semibold)
                }
            }
            .onChange(of: selectedPhoto) { _, newValue in
                Task {
                    if let data = try? await newValue?.loadTransferable(type: Data.self) {
                        photoData = data
                    }
                }
            }
        }
    }
    
    private func saveEntry() {
        let dateString = selectedDate.toLocalDateString()
        
        // Check for existing entry on this date
        if let existingEntry = experiment.entries.first(where: { $0.scheduledDate == dateString }) {
            // Update existing
            existingEntry.isCompleted = isCompleted
            existingEntry.noteText = noteText.isEmpty ? nil : noteText
            existingEntry.updatedAt = Date()
            // Photo handling would go here
        } else {
            // Create new entry
            let entry = Entry(
                experiment: experiment,
                scheduledDate: dateString,
                isCompleted: isCompleted,
                noteText: noteText.isEmpty ? nil : noteText
            )
            modelContext.insert(entry)
        }
        
        dismiss()
    }
}

#Preview {
    CheckInView(
        experiment: Experiment(
            title: "Test",
            purpose: "Test purpose"
        )
    )
    .modelContainer(for: [Experiment.self, Entry.self], inMemory: true)
}
