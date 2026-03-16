package net.runelite.blessedscripts.botLauncher;

public interface BotLiteInterface {

    void runScript(String account, String scriptName);

    void stopScript();

    void launch(String[] args) throws Exception;

    void init(boolean startClientBare) throws Exception;

}
