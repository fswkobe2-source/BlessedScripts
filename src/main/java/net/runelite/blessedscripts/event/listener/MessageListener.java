package net.runelite.blessedscripts.event.listener;

import net.runelite.blessedscripts.event.events.MessageEvent;

import java.util.EventListener;

public interface MessageListener extends EventListener {
	abstract void messageReceived(MessageEvent e);
}
