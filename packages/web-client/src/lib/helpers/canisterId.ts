import Log from '$lib/utils/Log';
import { Principal } from '@dfinity/principal';
import { isPrincipal } from '$lib/utils/isPrincipal';
import { userIndex } from './backend';

export async function getCanisterId(id: string): Promise<string | undefined> {
	const { canisterIdb } = await import('$lib/utils/idb');
	const canId = await canisterIdb.get(id);
	if (canId) return canId;
	else {
		try {
			if (isPrincipal(id)) {
				const res = await userIndex().get_user_canister_id_from_user_principal_id(
					Principal.from(id)
				);
				if (res[0]) {
					canisterIdb.set(id, res[0].toString());
					return res[0].toString();
				}
			} else {
				const res = await userIndex().get_user_canister_id_from_unique_user_name(id);
				if (res[0]) {
					canisterIdb.set(id, res[0].toString());
					return res[0].toString();
				}
			}
		} catch (e) {
			Log({ error: e, from: '1 getCanisterId' }, 'error');
			return;
		}
	}
}
