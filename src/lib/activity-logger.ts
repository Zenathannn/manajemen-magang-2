import { createClient } from "@/lib/supabase/client";

export async function logActivity(
    action: 'created' | 'updated' | 'deleted',
    entityType: string,
    entityId: string,
    description: string
) {
    const supabase = createClient();

    // AMBIL USER YANG SEDANG LOGIN
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("No user logged in");
        return;
    }

    const { error } = await supabase
        .from('activity_logs')
        .insert({
            user_id: user.id, // <-- INI PENTING!
            action: action,
            entity_type: entityType,
            entity_id: entityId,
            description: description,
            created_at: new Date().toISOString()
        });

    if (error) {
        console.error("Error logging activity:", error);
    }
}