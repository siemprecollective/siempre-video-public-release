from tkinter import Tk, Canvas, ALL

padding = 10
canvas_width = 800
canvas_height = 850

fs = {}

x0 = padding
y0 = padding + 50

width = 200
height = 200


m = Tk()
m.title('the network')

c = Canvas(m, width = canvas_width + (2*padding), height = canvas_height + (2*padding)) 
c.pack() 

def clear():
	c.delete(ALL)

def showPeople(people):
	if(len(people) > 0):
		print(people)
		counter = 0
		for name in people:
			p = person(name)

			x = x0 + ((counter%(canvas_width / width)) * width)
			y = y0 + (int(counter/(canvas_width / width)) * height)

			c.tag_bind(c.create_oval(x + 5, y + 5, x + width - 5, y + height - 5, fill="#ddd"), "<Button-1>", p.func)
			c.tag_bind(c.create_text(x + (width/2), y + (height/2), font="Calibri 30 bold", fill="black",text=name), "<Button-1>", p.func)

			counter = counter + 1
	else:
		c.create_text((canvas_width/2), (canvas_height/2), font="Calibri 30 bold", fill="black",text="No friends yet")
		c.create_text((canvas_width/2), (canvas_height/2) + 35, font="Calibri 20 bold", fill="black",text="(Click to return)")

def home(*args):
	people = []
	for name in fs:
		people += [name]
	returnHome()
	c.create_text((canvas_width/2), 35, font="Calibri 20 bold", fill="black",text="All users")
	showPeople(people)

def returnHome():
	c.tag_bind(c.create_rectangle(0, 0, canvas_width + (2*padding), canvas_height + (2*padding), fill="white", outline="white"), "<Button-1>", home)

class person:
	def __init__(self, name):
		self.name = name

	def func(self, *args):
		print(self.name)
		clear()
		returnHome()
		if(self.name in fs):
			c.create_text((canvas_width/2), 35, font="Calibri 20 bold", fill="black",text=(self.name + "'s friends"))
			showPeople(list(fs[self.name]))
		else:
			c.create_text((canvas_width/2), (canvas_height/2), font="Calibri 30 bold", fill="black",text="User not defined")
			c.create_text((canvas_width/2), (canvas_height/2) + 35, font="Calibri 20 bold", fill="black",text="(Click to return)")

home()
c.pack()
m.mainloop()