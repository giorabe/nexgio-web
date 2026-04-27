import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../shared/ui/card";
import { Button } from "../../../../shared/ui/button";
import useAdminExpenses from "../hooks/useAdminExpenses";
import useInternetSettings from "../hooks/useInternetSettings";
import { Input } from "../../../../shared/ui/input";
import { listPaymentsAll } from "../services/payments.service";

export default function AdminExpenses() {
  const { expenses, addExpense, removeExpense, totals, getPaidAmountForMonth } = useAdminExpenses();
  const { settings } = useInternetSettings();

  const [form, setForm] = React.useState({ description: "", amount: "", category: "Internet", date: new Date().toISOString().slice(0, 10) });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    addExpense({ description: form.description, amount: Number(form.amount), category: form.category, date: form.date, paid: true });
    setForm({ description: "", amount: "", category: "Internet", date: new Date().toISOString().slice(0, 10) });
  }

  const now = new Date();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const dueDate = (() => {
    const day = Math.max(1, Math.min(31, Number(settings.dueDay ?? 1)));
    return new Date(now.getFullYear(), now.getMonth(), day);
  })();

  const paidThisMonth = getPaidAmountForMonth("Internet");
  const requiredAmount = Number(settings.amount ?? 0);
  const isPaid = requiredAmount > 0 && paidThisMonth >= requiredAmount;

  const [serverCollected, setServerCollected] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await listPaymentsAll();
        const rows: any[] = (res?.data ?? []) as any[];
        const serverSum = rows
          .filter((p) => {
            const t = String(p?.payment_type ?? "").toLowerCase();
            // include advance payments (Collections) so they show in Total Collected
            return t === "full" || t === "partial" || t === "advance";
          })
          .reduce((acc: number, r: any) => acc + Number(r.amount ?? 0), 0);
        if (mounted) setServerCollected(serverSum);
      } catch (err) {
        console.error("AdminExpenses: failed to load payments", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const localTotalExpenses = expenses.reduce((a, b) => a + Number(b.amount ?? 0), 0);
  const totalCollected = serverCollected;
  const totalExpenses = localTotalExpenses;
  const totalIncome = totalCollected - totalExpenses;

  function formatShortDate(d: string) {
    try {
      const dt = new Date(d);
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const yy = String(dt.getFullYear()).slice(-2);
      return `${mm}/${dd}/${yy}`;
    } catch (err) {
      return d;
    }
  }

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Internet Account</CardTitle>
          <CardDescription>Provider, account and billing details (from Internet Settings)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Provider</div>
              <div className="font-semibold text-foreground">{settings.providerName || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Account Number</div>
              <div className="font-semibold text-foreground">{settings.accountNumber || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Plan</div>
              <div className="font-semibold text-foreground">{settings.plan || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Speed</div>
              <div className="font-semibold text-foreground">{settings.mbps ? `${settings.mbps} Mbps` : "-"}</div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Plan Amount</div>
              <div className="font-semibold text-foreground">{settings.providerName ? `₱${(requiredAmount || 0).toFixed(2)}` : "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Due Date</div>
              <div className="font-semibold text-foreground">{settings.providerName ? dueDate.toDateString() : "-"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Suspension Date</div>
              <div className="font-semibold text-foreground">{settings.providerName ? lastDayOfMonth.toDateString() : "-"}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-muted-foreground">Payment Status</div>
            <div className={`mt-1 font-semibold ${isPaid ? "text-green-400" : "text-yellow-400"}`}>{isPaid ? "Paid" : "Pending"} {isPaid ? ` (paid ₱${paidThisMonth.toFixed(2)})` : ` (paid ₱${paidThisMonth.toFixed(2)})`}</div>
          </div>
        </CardContent>
        <CardFooter />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Collected</CardTitle>
            <CardDescription className="text-sm">Sum of Client Payment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₱{totalCollected.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Expenses</CardTitle>
            <CardDescription className="text-sm">Sum of all recorded expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₱{totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Income</CardTitle>
            <CardDescription className="text-sm">Collected minus expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome >= 0 ? "text-green-400" : "text-red-400"}`}>₱{totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
          <CardDescription>Add a planned or one-off expense.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
            <Input placeholder="Amount" type="number" value={form.amount} onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))} />
            <div className="relative w-full">
              <select
                aria-label="Category"
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
                className="appearance-none bg-[#161616] border border-[#2A2A2A] text-white h-9 w-full min-w-0 rounded-md px-3 py-1 pr-8"
              >
                <option className="bg-[#161616] text-white">Internet</option>
                <option className="bg-[#161616] text-white">Hardware</option>
                <option className="bg-[#161616] text-white">Accessories</option>
                <option className="bg-[#161616] text-white">Other</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="flex gap-2">
              <Input type="date" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
              <Button type="submit">Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>List of recorded expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-4 py-2 align-top whitespace-nowrap">{e.description}</td>
                    <td className="px-4 py-2 align-top whitespace-nowrap">{e.category}</td>
                    <td className="px-4 py-2 align-top whitespace-nowrap">₱{Number(e.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-2 align-top whitespace-nowrap">{formatShortDate(e.date)}</td>
                    <td className="px-4 py-2 align-top whitespace-nowrap">{e.paid ? "Paid" : "Pending"}</td>
                    <td className="px-4 py-2 align-top whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="destructive" onClick={() => removeExpense(e.id)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-sm text-muted-foreground">
                      No expenses recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
