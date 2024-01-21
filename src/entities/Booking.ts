import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ParkingSpot } from './ParkingSpot';
import { User } from './User';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.bookings)
  user: User;

  @Column({ nullable: false })
  userId: number;

  @ManyToOne(() => ParkingSpot, (parkingSpot) => parkingSpot.bookings)
  parkingSpot: ParkingSpot;

  @Column({ nullable: false })
  parkingSpotId: number;

  @Column('timestamptz')
  startDate: Date;

  @Column('timestamptz')
  endDate: Date;

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;
}
