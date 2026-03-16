package net.runelite.blessedscripts.internal.listener;

import net.runelite.blessedscripts.internal.PassiveScriptHandler;
import net.runelite.blessedscripts.script.PassiveScript;

public interface PassiveScriptListener {

	public void scriptStarted(PassiveScriptHandler handler, PassiveScript script);

	public void scriptStopped(PassiveScriptHandler handler, PassiveScript script);
}
