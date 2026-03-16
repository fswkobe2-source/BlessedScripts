package net.runelite.blessedscripts.internal.listener;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.script.Script;
import net.runelite.blessedscripts.internal.ScriptHandler;

/**
 * @author GigiaJ
 */
public interface ScriptListener {

	public void scriptStarted(ScriptHandler handler, Script script);

	public void scriptStopped(ScriptHandler handler, Script script);

	public void scriptResumed(ScriptHandler handler, Script script);

	public void scriptPaused(ScriptHandler handler, Script script);

	public void inputChanged(BotLite bot, int mask);

}
