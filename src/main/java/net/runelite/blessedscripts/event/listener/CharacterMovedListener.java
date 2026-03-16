/**
 *
 */
package net.runelite.blessedscripts.event.listener;

import net.runelite.blessedscripts.event.events.CharacterMovedEvent;

import java.util.EventListener;

/**
 * @author GigiaJ
 */
public interface CharacterMovedListener extends EventListener {
	public void characterMoved(CharacterMovedEvent e);
}
