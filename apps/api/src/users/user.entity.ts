import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 254, unique: true }) email!: string;
  @Column({ length: 80 }) name!: string;
  @Column({ name: 'password_hash', select: false }) passwordHash!: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt!: Date;
}
export function profile(user: User) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}
