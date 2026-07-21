import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { paymentsApi } from '../api/payments'
import { queryKeys } from '../lib/queryKeys'
import type { PaymentInput, PaymentQuery } from '../types'

export function usePayments(query: PaymentQuery) {
  return useQuery({
    queryKey: queryKeys.paymentsList(query),
    queryFn: () => paymentsApi.list(query),
    placeholderData: keepPreviousData,
  })
}

export function useRevenue(year: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.revenue(year),
    queryFn: () => paymentsApi.revenue(year),
    enabled,
  })
}

export function useCreatePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PaymentInput) => paymentsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payments }),
  })
}
