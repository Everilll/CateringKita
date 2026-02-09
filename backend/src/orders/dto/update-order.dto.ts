import { IsEnum } from 'class-validator';

export enum OrderStatusFlow {
  confirmed = 'confirmed',
  preparing = 'preparing',
  ready = 'ready',
  on_delivery = 'on_delivery',
  delivered = 'delivered',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusFlow, {
    message: 'Status harus salah satu dari: confirmed, preparing, ready, on_delivery, delivered',
  })
  status: OrderStatusFlow;
}
