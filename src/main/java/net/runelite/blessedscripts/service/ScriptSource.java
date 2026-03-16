package net.runelite.blessedscripts.service;

import net.runelite.blessedscripts.script.Script;

import java.util.List;

/**
 * @author GigiaJ
 */
public interface ScriptSource {

	List<ScriptDefinition> list();

	Script load(ScriptDefinition def) throws ServiceException;

}
