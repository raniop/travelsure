// API Client for BBQ Manager - works with your server
// Using ASHX (C#) as PHP doesn't work on this server
// In development, use proxy through Vite; in production, use full URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '/api-bbq.ashx' : 'https://ophir.travelsure.co.il/api-bbq.ashx');

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const TOKEN_KEY = 'bbq_token';
export const BBQ_AUTH_EXPIRED_EVENT = 'bbq-auth-expired';

export function getBbqToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setBbqToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked: the session lasts until the page closes
  }
}

/** Error from the server with its machine code (e.g. wrong_password, user_exists). */
export class ApiError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message);
  }
}

export type LedgerType = 'opening' | 'deposit' | 'charge' | 'refund' | 'adjustment' | 'transfer';

export interface LedgerHint {
  type: Exclude<LedgerType, 'opening'>;
  note?: string;
  event_id?: string;
}

export interface LedgerEntry {
  id: string;
  group_id: string;
  member_id: string;
  type: LedgerType;
  amount: number;
  balance_before: number;
  balance_after: number;
  note?: string;
  event_id?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface TransferRequest {
  id: string;
  group_id: string;
  member_id: string;
  amount: number;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason?: string;
  source?: 'app' | 'link';
  has_proof_image?: boolean;
  created_at: string;
  decided_at?: string;
}

export interface Receipt {
  id: string;
  event_id?: string;
  label?: string;
  amount?: number;
  has_image?: boolean;
  created_at?: string;
}

export interface PublicEvent {
  id: string;
  event_date: string;
  description?: string | null;
  butcher_cost?: number;
  grocery_cost?: number;
  total_cost?: number;
  location?: string | null;
  attending: boolean;
  participants: number;
  my_amount?: number;
  my_status?: string;
  receipts: Receipt[];
}

export interface PayboxMeta {
  imported_at: string;
  imported_by_name?: string;
  count: number;
  first_date: string;
  last_date: string;
}

export interface PayboxNote {
  id: string;
  member_id?: string;
  date: string;
  amount: number;
  note: string;
}

export interface PayboxStoredRow {
  date: string;
  kind: 'in' | 'out';
  name: string;
  phone: string;
  amount: number;
  note: string;
}

export interface PublicMemberPage {
  paybox?: {
    meta: PayboxMeta;
    deposits: { date: string; amount: number; note?: string }[];
    total: number;
    group_in: number;
    group_out: number;
    notes?: PayboxNote[];
  } | null;
  group: { id: string; name: string; group_image?: string | null };
  member: { id: string; name: string; nickname?: string | null; balance?: number };
  events: PublicEvent[];
  ledger: LedgerEntry[];
  transfers: TransferRequest[];
  group_totals: { members: number; balances_sum: number; deposits: number; charges: number };
}

export interface AuthResult {
  token: string;
  user: { id: string; name: string; phone: string; profile_image?: string | null; [key: string]: unknown };
  password_set?: boolean;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // The session token rides in the query string and bodies go as text/plain: IIS answers the
    // CORS preflight itself without CORS headers, so only preflight-free requests reach the server.
    const token = getBbqToken();
    const url = `${API_BASE_URL}?${endpoint}${token ? `&auth=${encodeURIComponent(token)}` : ''}`;

    const response = await fetch(url, {
      ...options,
      headers: options.body ? { 'Content-Type': 'text/plain;charset=UTF-8' } : undefined,
    });

    if (response.status === 401) {
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (data?.error === 'auth_required') {
        setBbqToken(null);
        try {
          localStorage.removeItem('bbq_current_user');
        } catch {
          // ignore
        }
        window.dispatchEvent(new Event(BBQ_AUTH_EXPIRED_EVENT));
        throw new ApiError('צריך להתחבר מחדש', 'auth_required', 401);
      }
      throw new ApiError(data?.error || 'שגיאת הרשאה', data?.error || 'unauthorized', 401);
    }

    if (!response.ok) {
      // Read response text once
      const text = await response.text();
      console.error(`API Error [${response.status}]:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        responseText: text.substring(0, 500)
      });
      
      let errorData: any = null;
      
      // Try to parse as JSON, but fallback to text if it fails
      try {
        // Check if response is HTML (404 page) instead of JSON
        if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
          errorData = { 
            error: `HTTP ${response.status}: ${response.statusText}`, 
            details: 'Server returned HTML instead of JSON. File may not exist or PHP is not configured correctly.' 
          };
        } else if (text.trim()) {
          // Try to parse as JSON
          errorData = JSON.parse(text);
        } else {
          errorData = { error: 'Unknown error' };
        }
      } catch (parseError) {
        // If parsing fails, use the raw text
        console.error('Failed to parse error response:', parseError, 'Raw text:', text.substring(0, 500));
        errorData = { 
          error: `HTTP ${response.status}: ${response.statusText}`, 
          details: text || 'Unknown error' 
        };
      }
      
      const errorMessage = errorData?.error || errorData?.details || errorData?.message || text || `HTTP ${response.status}`;
      throw new ApiError(errorMessage, String(errorData?.error || ''), response.status);
    }

    // Check if response is actually JSON before parsing
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    // Remove BOM if present
    const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
    
    try {
      return JSON.parse(cleanText);
    } catch (parseError: any) {
      console.error('JSON Parse Error:', {
        error: parseError.message,
        position: parseError.message.match(/position (\d+)/)?.[1],
        text: cleanText.substring(0, 200),
        fullText: cleanText
      });
      throw new Error(`Invalid JSON response: ${parseError.message}. Response: ${cleanText.substring(0, 200)}`);
    }
  }

  // Groups
  async getGroups(): Promise<any[]> {
    return this.request('entity=groups');
  }

  async getGroup(id: string): Promise<any> {
    return this.request(`entity=groups&id=${id}`);
  }

  async createGroup(data: any): Promise<any> {
    return this.request('entity=groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGroup(id: string, data: any): Promise<any> {
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=groups&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Members
  async getMembers(groupId?: string): Promise<any[]> {
    const params = groupId ? `entity=members&group_id=${groupId}` : 'entity=members';
    return this.request(params);
  }

  async createMember(data: any): Promise<any> {
    return this.request('entity=members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * When the balance changes, the server writes a ledger line by itself; `ledger` only says why
   * (deposit, event charge, refund on recalculation, manual adjustment) and is not stored on the member.
   */
  async updateMember(id: string, data: any, ledger?: LedgerHint): Promise<any> {
    return this.request(`entity=members&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(ledger ? { ...data, _ledger: ledger } : data),
    });
  }

  // Transfers ("העברתי"): a member reports a PayBox transfer, the group owner approves or rejects it
  async getTransfers(groupId: string): Promise<TransferRequest[]> {
    return this.request(`entity=transfers&group_id=${encodeURIComponent(groupId)}`);
  }

  async getTransfer(id: string): Promise<TransferRequest & { proof_image?: string }> {
    return this.request(`entity=transfers&id=${encodeURIComponent(id)}`);
  }

  async createTransfer(data: { group_id: string; amount: number; note?: string; proof_image?: string }): Promise<TransferRequest> {
    return this.request('entity=transfers', { method: 'POST', body: JSON.stringify(data) });
  }

  async decideTransfer(id: string, decision: 'approve' | 'reject', reason?: string): Promise<TransferRequest> {
    return this.request(`entity=transfers&id=${encodeURIComponent(id)}&action=${decision}`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || '' }),
    });
  }

  // Receipts: photos of the butcher/grocery bills behind an event's cost
  async getReceipts(eventId: string): Promise<Receipt[]> {
    return this.request(`entity=receipts&event_id=${encodeURIComponent(eventId)}`);
  }

  async getReceipt(id: string): Promise<Receipt & { image?: string }> {
    return this.request(`entity=receipts&id=${encodeURIComponent(id)}`);
  }

  async createReceipt(data: { event_id: string; image: string; label?: string; amount?: number }): Promise<Receipt> {
    return this.request('entity=receipts', { method: 'POST', body: JSON.stringify(data) });
  }

  async deleteReceipt(id: string): Promise<void> {
    await this.request(`entity=receipts&id=${encodeURIComponent(id)}&action=delete`, { method: 'POST', body: '{}' });
  }

  // PayBox export (owner only): replace the stored history / read it back for the comparison
  async getPaybox(groupId: string): Promise<{ meta: PayboxMeta | null; rows: PayboxStoredRow[] }> {
    return this.request(`action=paybox&group_id=${encodeURIComponent(groupId)}`);
  }

  async getPayboxNotes(groupId: string): Promise<PayboxNote[]> {
    return this.request(`action=paybox_notes&group_id=${encodeURIComponent(groupId)}`);
  }

  async addPayboxNote(groupId: string, note: { member_id: string; date: string; amount: number; note: string }): Promise<PayboxNote[]> {
    return this.request(`action=paybox_notes&group_id=${encodeURIComponent(groupId)}`, { method: 'POST', body: JSON.stringify(note) });
  }

  async deletePayboxNote(groupId: string, id: string): Promise<PayboxNote[]> {
    return this.request(`action=paybox_notes&group_id=${encodeURIComponent(groupId)}&op=delete&id=${encodeURIComponent(id)}`, {
      method: 'POST',
      body: '{}',
    });
  }

  async uploadPaybox(groupId: string, rows: PayboxStoredRow[]): Promise<PayboxMeta> {
    return this.request(`action=paybox&group_id=${encodeURIComponent(groupId)}`, {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  }

  // Personal read-only link per member (owner only)
  async getMemberLink(memberId: string): Promise<{ key: string }> {
    return this.request(`action=member_link&member_id=${encodeURIComponent(memberId)}`);
  }

  async createMemberLink(memberId: string): Promise<{ key: string }> {
    return this.request(`action=member_link&member_id=${encodeURIComponent(memberId)}`, { method: 'POST', body: '{}' });
  }

  // The personal page itself (no sign-in: the key in the link is the access)
  async getPublicPage(key: string): Promise<PublicMemberPage> {
    return this.request(`action=public&key=${encodeURIComponent(key)}`);
  }

  async getPublicReceipt(key: string, id: string): Promise<Receipt & { image?: string }> {
    return this.request(`action=public_receipt&key=${encodeURIComponent(key)}&id=${encodeURIComponent(id)}`);
  }

  async createPublicTransfer(key: string, data: { amount: number; note?: string; proof_image?: string }): Promise<TransferRequest> {
    return this.request(`action=public_transfer&key=${encodeURIComponent(key)}`, { method: 'POST', body: JSON.stringify(data) });
  }

  /** Append-only balance history (written only by the server). Oldest first. */
  async getLedger(groupId: string, memberId?: string): Promise<LedgerEntry[]> {
    const q = `entity=ledger&group_id=${encodeURIComponent(groupId)}` +
      (memberId ? `&member_id=${encodeURIComponent(memberId)}` : '');
    return this.request(q);
  }

  async deleteMember(id: string): Promise<void> {
    await this.request(`entity=members&id=${id}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents(groupId?: string): Promise<any[]> {
    const params = groupId ? `entity=events&group_id=${groupId}` : 'entity=events';
    return this.request(params);
  }

  async getEvent(id: string): Promise<any> {
    return this.request(`entity=events&id=${id}`);
  }

  async createEvent(data: any): Promise<any> {
    return this.request('entity=events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEvent(id: string, data: any): Promise<any> {
    return this.request(`entity=events&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string): Promise<void> {
    // Use POST with action=delete instead of DELETE to avoid IIS restrictions
    await this.request(`entity=events&id=${id}&action=delete`, {
      method: 'POST',
    });
  }

  // Attendees
  async getAttendees(eventId: string): Promise<any[]> {
    return this.request(`entity=attendees&event_id=${eventId}`);
  }

  async createAttendee(data: any): Promise<any> {
    return this.request('entity=attendees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttendee(id: string, data: any): Promise<any> {
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=attendees&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Guests
  async getGuests(eventId: string): Promise<any[]> {
    return this.request(`entity=guests&event_id=${eventId}`);
  }

  async createGuest(data: any): Promise<any> {
    return this.request('entity=guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGuest(id: string, data: any): Promise<any> {
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=guests&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Payments
  async getPayments(eventId?: string): Promise<any[]> {
    const params = eventId ? `entity=payments&event_id=${eventId}` : 'entity=payments';
    return this.request(params);
  }

  async createPayment(data: any): Promise<any> {
    return this.request('entity=payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayment(id: string, data: any): Promise<any> {
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=payments&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentByPayer(eventId: string, payerId: string, payerType: string): Promise<any | null> {
    const payments = await this.getPayments(eventId);
    return payments.find((p: any) => p.payer_id === payerId && p.payer_type === payerType) || null;
  }

  async deletePayment(id: string): Promise<void> {
    return this.request(`entity=payments&id=${id}&action=delete`, {
      method: 'POST',
    });
  }

  // Sign-in (checked on the server; it returns a session token and the user without secrets)
  async login(phone: string, password: string): Promise<AuthResult> {
    const result = await this.request<AuthResult>('action=login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
    setBbqToken(result.token);
    return result;
  }

  async register(name: string, phone: string, password: string): Promise<AuthResult> {
    const result = await this.request<AuthResult>('action=register', {
      method: 'POST',
      body: JSON.stringify({ name, phone, password }),
    });
    setBbqToken(result.token);
    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.request('action=logout', { method: 'POST', body: '{}' });
    } catch {
      // the local session is cleared anyway
    }
    setBbqToken(null);
  }

  // Users
  async getUsers(): Promise<any[]> {
    return this.request('entity=users');
  }

  async getUser(id: string): Promise<any> {
    return this.request(`entity=users&id=${id}`);
  }

  async getUserByPhone(phone: string): Promise<any | null> {
    const users = await this.getUsers();
    return users.find((u: any) => u.phone === phone) || null;
  }

  async updateUser(id: string, data: any): Promise<any> {
    // Use POST with action=update instead of PUT to avoid IIS restrictions
    return this.request(`entity=users&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Group Invitations
  async getGroupInvitations(userPhone?: string, groupId?: string): Promise<any[]> {
    let query = 'entity=group_invitations';
    if (userPhone) {
      query += `&user_phone=${encodeURIComponent(userPhone)}`;
    }
    if (groupId) {
      query += `&group_id=${encodeURIComponent(groupId)}`;
    }
    return this.request(query);
  }

  async createGroupInvitation(data: any): Promise<any> {
    return this.request('entity=group_invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGroupInvitation(id: string, data: any): Promise<any> {
    return this.request(`entity=group_invitations&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteGroupInvitation(id: string): Promise<void> {
    return this.request(`entity=group_invitations&id=${id}&action=delete`, {
      method: 'POST',
    });
  }

  // Polls
  async getPolls(groupId?: string): Promise<any[]> {
    const params = groupId ? `entity=polls&group_id=${groupId}` : 'entity=polls';
    return this.request(params);
  }

  async getPoll(id: string): Promise<any> {
    return this.request(`entity=polls&id=${id}`);
  }

  async createPoll(data: any): Promise<any> {
    return this.request('entity=polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePoll(id: string, data: any): Promise<any> {
    return this.request(`entity=polls&id=${id}&action=update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePoll(id: string): Promise<void> {
    return this.request(`entity=polls&id=${id}&action=delete`, {
      method: 'POST',
    });
  }

  async votePoll(pollId: string, optionId: string, memberId: string): Promise<any> {
    return this.request('entity=polls&action=vote', {
      method: 'POST',
      body: JSON.stringify({
        poll_id: pollId,
        option_id: optionId,
        member_id: memberId
      }),
    });
  }
}

export const apiClient = new ApiClient();
