import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvestmentService } from '../../services/investment.service';
import { Investor, Transaction } from '../../models';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.css']
})
export class WithdrawComponent implements OnInit {
  investors: Investor[] = [];
  transactionForm!: FormGroup;
  SelectedInvestorTransection: any[]=[];
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private svc: InvestmentService) {}

  ngOnInit() {
    this.transactionForm = this.fb.group({
      investorId: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: ['', Validators.required]
    });

    // Load investors
    this.svc.listInvestors().subscribe(inv => (this.investors = inv));
  }

  // onInvestorChange(investorId: string) {
  //   if (!investorId) return;
  //   this.svc.listTransactionsByInvestor(investorId).subscribe(transactions => {
  //     console.log('Transactions for investor', investorId, transactions);
  //     this.SelectedInvestorTransection = transactions;
  //   });
  // }

  onSubmit() {
    if (this.transactionForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const formData = this.transactionForm.value;
      const investor = this.investors.find(i => i.id === formData.investorId);

      const transactionData: Omit<Transaction, 'id'> = {
        investorId: formData.investorId,
        investorName: investor ? investor.name : '',
        amount: formData.amount,
        date: new Date(formData.date),
        type: 'withdraw'
      };

      this.svc.addTransaction(transactionData)
        .then(() => {
          this.loading = false;
          this.successMessage = 'Withdrawal processed successfully!';
          this.transactionForm.reset({
            investorId: '',
            amount: null,
            date: ''
          });
        })
        .catch(error => {
          this.loading = false;
          this.errorMessage = 'Error processing withdrawal. Please try again.';
          console.error('Error saving transaction:', error);
        });
    } else {
      this.transactionForm.markAllAsTouched();
    }
  }

}
