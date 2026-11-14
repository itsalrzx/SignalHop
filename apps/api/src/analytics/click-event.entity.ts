import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Link } from '../links/link.entity';
@Entity('click_events')
export class ClickEvent {
  @PrimaryColumn('uuid') id!: string;
  @Column({ name: 'link_id', type: 'uuid' }) linkId!: string;
  @ManyToOne(() => Link, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'link_id' }) link!: Link;
  @Column({ name: 'occurred_at', type: 'timestamptz' }) occurredAt!: Date;
  @Column({ name: 'visitor_hash', length: 64 }) visitorHash!: string;
  @Column({ length: 253 }) referrer!: string;
  @Column({ length: 30 }) device!: string;
  @Column({ length: 80 }) browser!: string;
}
