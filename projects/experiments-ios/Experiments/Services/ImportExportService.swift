//
//  ImportExportService.swift
//  Experiments
//
//  JSON import/export for experiments.
//

import Foundation
import SwiftData

/// Service for importing and exporting experiments as JSON.
class ImportExportService {
    
    static let shared = ImportExportService()
    
    private let currentVersion = 1
    
    private init() {}
    
    // MARK: - Export
    
    /// Exports an experiment to JSON data.
    func exportExperiment(_ experiment: Experiment, includeEntries: Bool = true) throws -> Data {
        let exportData = ExportContainer(
            version: currentVersion,
            exportedAt: Date(),
            experiments: [ExperimentExport(from: experiment, includeEntries: includeEntries)]
        )
        
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        
        return try encoder.encode(exportData)
    }
    
    /// Creates a shareable file URL for an experiment.
    func createShareableFile(for experiment: Experiment) throws -> URL {
        let data = try exportExperiment(experiment)
        
        let filename = "\(experiment.title.replacingOccurrences(of: " ", with: "_")).json"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        
        try data.write(to: tempURL)
        return tempURL
    }
    
    // MARK: - Import
    
    /// Imports experiments from JSON data.
    @discardableResult
    func importExperiments(from data: Data, into context: ModelContext) throws -> Int {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        let container = try decoder.decode(ExportContainer.self, from: data)
        
        // Version validation
        guard container.version <= currentVersion else {
            throw ImportError.unsupportedVersion(container.version)
        }
        
        var importedCount = 0
        
        for experimentExport in container.experiments {
            let experiment = Experiment(
                title: experimentExport.title,
                purpose: experimentExport.purpose,
                successCriteria: experimentExport.successCriteria,
                startDate: experimentExport.startDate,
                durationDays: experimentExport.durationDays,
                frequency: experimentExport.frequency,
                status: .active // Always start as active on import
            )
            
            context.insert(experiment)
            
            // Import entries
            for entryExport in experimentExport.entries {
                let entry = Entry(
                    experiment: experiment,
                    scheduledDate: entryExport.scheduledDate,
                    isCompleted: entryExport.isCompleted,
                    noteText: entryExport.noteText
                )
                context.insert(entry)
            }
            
            importedCount += 1
        }
        
        return importedCount
    }
}

// MARK: - Export Models

struct ExportContainer: Codable {
    let version: Int
    let exportedAt: Date
    let experiments: [ExperimentExport]
}

struct ExperimentExport: Codable {
    let id: String
    let title: String
    let purpose: String
    let successCriteria: String?
    let startDate: Date
    let durationDays: Int
    let frequency: ExperimentFrequency
    let labName: String?
    let entries: [EntryExport]
    
    init(from experiment: Experiment, includeEntries: Bool) {
        self.id = experiment.id.uuidString
        self.title = experiment.title
        self.purpose = experiment.purpose
        self.successCriteria = experiment.successCriteria
        self.startDate = experiment.startDate
        self.durationDays = experiment.durationDays
        self.frequency = experiment.frequency
        self.labName = experiment.lab?.name
        self.entries = includeEntries ? experiment.entries.map { EntryExport(from: $0) } : []
    }
}

struct EntryExport: Codable {
    let scheduledDate: String
    let isCompleted: Bool
    let noteText: String?
    
    init(from entry: Entry) {
        self.scheduledDate = entry.scheduledDate
        self.isCompleted = entry.isCompleted
        self.noteText = entry.noteText
    }
}

// MARK: - Errors

enum ImportError: LocalizedError {
    case unsupportedVersion(Int)
    case invalidFormat
    case missingRequiredField(String)
    
    var errorDescription: String? {
        switch self {
        case .unsupportedVersion(let version):
            return "Unsupported export version: \(version). Please update the app."
        case .invalidFormat:
            return "The file format is invalid."
        case .missingRequiredField(let field):
            return "Missing required field: \(field)"
        }
    }
}
