//
//  Reflection.swift
//  Experiments
//
//  Reflection model for the REACT phase (Plus, Minus, Next).
//

import Foundation
import SwiftData

/// A Reflection captures the REACT phase of the Tiny Experiments Framework.
/// Uses the Plus-Minus-Next format for structured reflection.
@Model
final class Reflection {
    
    // MARK: - Properties
    
    /// Unique identifier.
    @Attribute(.unique)
    var id: UUID
    
    /// Parent experiment.
    var experiment: Experiment?
    
    /// Date of reflection.
    var date: Date
    
    // MARK: - Plus-Minus-Next
    
    /// PLUS: What went well?
    var plusLog: String
    
    /// MINUS: What was difficult?
    var minusLog: String
    
    /// NEXT: What will I do differently?
    var nextSteps: String
    
    // MARK: - Decision
    
    /// Outcome decision after reflection.
    var decision: ReflectionDecision
    
    // MARK: - Metadata
    
    var createdAt: Date
    
    // MARK: - Initialization
    
    init(
        id: UUID = UUID(),
        experiment: Experiment? = nil,
        date: Date = Date(),
        plusLog: String,
        minusLog: String,
        nextSteps: String,
        decision: ReflectionDecision = .persist
    ) {
        self.id = id
        self.experiment = experiment
        self.date = date
        self.plusLog = plusLog
        self.minusLog = minusLog
        self.nextSteps = nextSteps
        self.decision = decision
        self.createdAt = Date()
    }
}
