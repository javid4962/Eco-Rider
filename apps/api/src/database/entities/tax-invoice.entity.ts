import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tax_invoices')
export class TaxInvoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_tax_invoices_number', { unique: true })
  @Column({ type: 'varchar', length: 50, unique: true, name: 'invoice_number' })
  invoiceNumber!: string;

  @Index('idx_tax_invoices_booking', { unique: true })
  @Column({ type: 'uuid', unique: true, name: 'booking_id' })
  bookingId!: string;

  @Index('idx_tax_invoices_rider')
  @Column({ type: 'uuid', name: 'rider_id' })
  riderId!: string;

  @Column({ type: 'varchar', length: 20, default: '996412', name: 'sac_code' })
  sacCode!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: '37AAAAA0000A1Z5',
    name: 'supplier_gstin',
  })
  supplierGstin!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'Andhra Pradesh',
    name: 'supplier_state',
  })
  supplierState!: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: '37',
    name: 'supplier_state_code',
  })
  supplierStateCode!: string;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'Andhra Pradesh (37)',
    name: 'place_of_supply',
  })
  placeOfSupply!: string;

  @Column({ type: 'bigint', name: 'base_fare_paise' })
  baseFarePaise!: number;

  @Column({ type: 'bigint', name: 'cgst_paise' })
  cgstPaise!: number;

  @Column({ type: 'bigint', name: 'sgst_paise' })
  sgstPaise!: number;

  @Column({ type: 'bigint', name: 'total_tax_paise' })
  totalTaxPaise!: number;

  @Column({ type: 'bigint', name: 'total_amount_paise' })
  totalAmountPaise!: number;

  @Column({ type: 'varchar', length: 10, default: 'INR' })
  currency!: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()', name: 'invoice_date' })
  invoiceDate!: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}

