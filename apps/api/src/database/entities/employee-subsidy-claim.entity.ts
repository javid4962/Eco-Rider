import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('employee_subsidy_claims')
export class EmployeeSubsidyClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId: string;

  @Column({ name: 'employee_user_id', type: 'uuid' })
  employeeUserId: string;

  @Column({ name: 'corporate_account_id', type: 'uuid' })
  corporateAccountId: string;

  @Column({ name: 'total_trip_fare_paise', type: 'int' })
  totalTripFarePaise: number;

  @Column({ name: 'employer_subsidized_paise', type: 'int' })
  employerSubsidizedPaise: number;

  @Column({ name: 'employee_payable_paise', type: 'int' })
  employeePayablePaise: number;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}

