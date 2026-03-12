import { supabase } from './supabase';
import { Event } from '../types';

export async function sendEventEmail(record: Partial<Event>, action: 'create' | 'update' | 'delete') {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { record, action },
    });

    if (error) {
      console.error(`Edge function error during ${action}:`, error);
    }
  } catch (emailError) {
    console.error(`Failed to send ${action} email notification:`, emailError);
  }
}

export async function deleteEventWithEmail(event: Event) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', event.id);

  if (error) {
    throw error;
  }

  await sendEventEmail(event, 'delete');
}
