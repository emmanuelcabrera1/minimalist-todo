//
//  StoreKitManager.swift
//  Experiments
//
//  StoreKit 2 manager for in-app purchases.
//

import Foundation
import StoreKit

/// Manages in-app purchases using StoreKit 2.
@MainActor
class StoreKitManager: ObservableObject {
    
    static let shared = StoreKitManager()
    
    @Published var isPro = false
    @Published var isLoading = false
    
    private let proProductId = "com.experiments.pro"
    private var product: Product?
    private var updateListenerTask: Task<Void, Error>?
    
    private init() {
        updateListenerTask = listenForTransactions()
        
        Task {
            await checkPurchaseStatus()
            await loadProducts()
        }
    }
    
    deinit {
        updateListenerTask?.cancel()
    }
    
    // MARK: - Products
    
    private func loadProducts() async {
        do {
            let products = try await Product.products(for: [proProductId])
            product = products.first
        } catch {
            print("Failed to load products: \(error)")
        }
    }
    
    // MARK: - Purchase
    
    func purchase() async {
        guard let product = product else {
            print("Product not loaded")
            return
        }
        
        isLoading = true
        defer { isLoading = false }
        
        do {
            let result = try await product.purchase()
            
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                await transaction.finish()
                isPro = true
                
            case .pending:
                print("Purchase pending")
                
            case .userCancelled:
                print("User cancelled")
                
            @unknown default:
                break
            }
        } catch {
            print("Purchase failed: \(error)")
        }
    }
    
    // MARK: - Restore
    
    func restore() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            try await AppStore.sync()
            await checkPurchaseStatus()
        } catch {
            print("Restore failed: \(error)")
        }
    }
    
    // MARK: - Status
    
    private func checkPurchaseStatus() async {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                if transaction.productID == proProductId {
                    isPro = true
                    return
                }
            }
        }
        isPro = false
    }
    
    // MARK: - Transaction Listener
    
    private func listenForTransactions() -> Task<Void, Error> {
        Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try self.checkVerified(result)
                    
                    await MainActor.run {
                        if transaction.productID == self.proProductId {
                            self.isPro = true
                        }
                    }
                    
                    await transaction.finish()
                } catch {
                    print("Transaction verification failed: \(error)")
                }
            }
        }
    }
    
    // MARK: - Verification
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw StoreError.verificationFailed
        case .verified(let safe):
            return safe
        }
    }
}

enum StoreError: Error {
    case verificationFailed
}

// MARK: - Pro Gating

extension StoreKitManager {
    
    /// Maximum active experiments for free tier.
    static let freeExperimentLimit = 3
    
    /// Checks if user can create a new experiment.
    func canCreateExperiment(currentCount: Int) -> Bool {
        return isPro || currentCount < Self.freeExperimentLimit
    }
}
