import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("autoresponses")
export class AutoResponse {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text" })
  guild!: string;

  @Column({ type: "text" })
  response!: string;

  @Column({ type: "text" })
  trigger!: string;

  @Column({
    enum: ["exact", "contains", "starts_with", "ends_with", "strict_contains"],
    default: "strict_contains",
  })
  triggerType!:
    | "exact"
    | "contains"
    | "starts_with"
    | "ends_with"
    | "strict_contains";
}
