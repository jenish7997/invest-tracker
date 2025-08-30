import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvestmentService } from '../../services/investment.service';

@Component({
  selector: 'app-add-investor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-investor.component.html'
})
export class AddInvestorComponent {
  investorForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private fb: FormBuilder, private svc: InvestmentService) {
    this.investorForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.investorForm.invalid) {
      this.investorForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const id = await this.svc.addInvestor(this.investorForm.value.name);
      this.successMessage = `Investor added successfully (ID: ${id})`;
      this.investorForm.reset();
    } catch (err) {
      console.error(err);
      this.errorMessage = 'Error adding investor. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
