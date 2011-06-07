﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace ExtDirectHandler.Configuration
{
	public class ReflectionConfigurator
	{
		private readonly IList<Type> _types = new List<Type>();

		public ReflectionConfigurator RegisterTypes(params Type[] types)
		{
			return RegisterTypes(types.AsEnumerable());
		}

		public ReflectionConfigurator RegisterType<T>()
		{
			return RegisterType(typeof(T));
		}

		public ReflectionConfigurator RegisterTypes(IEnumerable<Type> types)
		{
			foreach(Type type in types)
			{
				RegisterType(type);
			}
			return this;
		}

		public ReflectionConfigurator RegisterType(Type type)
		{
			_types.Add(type);
			return this;
		}

		public void Configure()
		{
			var metadata = new Metadata();
			FillMetadata(metadata);
			DirectHttpHandler.SetActionMetadatas(metadata);
		}

		internal void FillMetadata(Metadata ret)
		{
			foreach(var type in _types)
			{
				var actionName = type.Name;
				ret.AddAction(actionName, type);
				foreach(var methodInfo in type.GetMethods(BindingFlags.DeclaredOnly | BindingFlags.Public | BindingFlags.Instance))
				{
					ret.AddMethod(actionName, pascalizeName(methodInfo.Name), methodInfo);
				}
			}
		}

		private string pascalizeName(string name)
		{
			return name.Substring(0, 1).ToLowerInvariant() + name.Substring(1);
		}
	}
}