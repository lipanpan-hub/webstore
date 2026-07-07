import { Injectable } from '@nestjs/common'
import type { PaymentMethodDetail } from '@webstore/shared'
import type { PaymentGateway } from './payment-gateway.interface.js'
import { AlipayGateway } from './alipay.gateway.js'
import { CreemGateway } from './creem.gateway.js'
import { EpayGateway } from './epay.gateway.js'

// 工厂模式：按支付方式的服务商类型创建对应网关策略实例
@Injectable()
export class PaymentGatewayFactory {
  create(method: PaymentMethodDetail): PaymentGateway {
    switch (method.provider) {
      case 'alipay':
        return new AlipayGateway(method.config)
      case 'creem':
        return new CreemGateway(method.config)
      case 'epay':
        return new EpayGateway(method.config)
      default:
        throw new Error(`暂不支持的支付服务商: ${method.provider}`)
    }
  }
}
