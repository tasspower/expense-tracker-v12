import { z } from 'zod'

export const transactionSchema = z.object({
  title: z.string().min(1, 'กรุณากรอกชื่อรายการ'),
  amount: z.coerce.number().gt(0, 'จำนวนเงินต้องมากกว่า 0'),
  type: z.enum(['INCOME', 'EXPENSE'], { required_error: 'กรุณาเลือกประเภทรายการ' }),
  date: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  note: z.string().optional()
})

export type TransactionInput = z.infer<typeof transactionSchema>
